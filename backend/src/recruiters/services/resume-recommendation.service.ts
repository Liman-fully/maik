import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../entities/job.entity';
import { Resume } from '../../resumes/entities/resume.entity';
import { JobApplication } from '../entities/job-application.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import { MeilisearchService } from '../../common/meilisearch/meilisearch.service';
import { RedisService } from '../../common/redis/redis.service';

export interface ResumeRecommendation {
  resume: Resume;
  score: number;
  matchingFactors: {
    skills: { matched: string[]; score: number };
    experience: { years: number; score: number };
    education: { matched: boolean; score: number };
    location: { matched: boolean; score: number };
    salary: { matchLevel: 'low' | 'good' | 'high' | 'unknown'; score: number };
    overall: number;
  };
  explanation: string;
}

export interface JobRecommendation {
  job: Job;
  score: number;
  matchingFactors: {
    skills: { matched: string[]; score: number };
    experience: { matchLevel: 'low' | 'good' | 'high' | 'perfect'; score: number };
    education: { matched: boolean; score: number };
    location: { matchLevel: 'exact' | 'nearby' | 'remote' | 'unknown'; score: number };
    salary: { matchLevel: 'low' | 'good' | 'high' | 'unknown'; score: number };
    overall: number;
  };
  explanation: string;
}

@Injectable()
export class ResumeRecommendationService {
  private readonly logger = new Logger(ResumeRecommendationService.name);
  private readonly CACHE_TTL = 3600; // 1小时缓存

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Resume)
    private readonly resumeRepository: Repository<Resume>,
    @InjectRepository(JobApplication)
    private readonly applicationRepository: Repository<JobApplication>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly meilisearchService: MeilisearchService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 为职位推荐简历
   */
  async getRecommendedResumesForJob(
    jobId: string,
    userId: string,
    limit: number = 20,
  ): Promise<ResumeRecommendation[]> {
    try {
      const cacheKey = `job:${jobId}:recommended_resumes:${limit}`;
      
      // 检查缓存
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const job = await this.jobRepository.findOne({
        where: { id: jobId },
        relations: ['recruiter'],
      });

      if (!job) {
        throw new Error('职位不存在');
      }

      // 检查权限
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (job.recruiter_id !== userId && user?.role !== UserRole.ADMIN) {
        throw new Error('没有权限查看此职位的推荐简历');
      }

      // 获取已经申请过的简历ID
      const existingApplications = await this.applicationRepository.find({
        where: { job: { id: jobId } },
        select: ['resume_id'],
      });
      const appliedResumeIds = existingApplications.map(app => app.resume_id).filter(Boolean);

      // 搜索匹配的简历
      const searchParams = this.buildResumeSearchParams(job);
      try {
        const searchResult = await this.meilisearchService.search('resumes', '', {
          filter: this.buildResumeFilters(job, appliedResumeIds),
          limit,
          sort: ['match_score:desc'],
        });

        // 获取完整的简历数据
        const resumeIds = searchResult.hits.map((hit: any) => hit.id);
        const resumes = await this.resumeRepository.find({
          where: { id: resumeIds as any },
          relations: [
            'user',
            'experiences',
            'educations',
            'skills',
            'projects',
          ],
        });

        // 计算匹配度
        const recommendations: ResumeRecommendation[] = resumes.map(resume => {
          const score = this.calculateResumeJobMatch(resume, job);
          return {
            resume,
            score: score.overall,
            matchingFactors: score,
            explanation: this.generateExplanation(resume, job, score),
          };
        });

        // 按分数排序
        recommendations.sort((a, b) => b.score - a.score);

        // 缓存结果
        await this.redisService.set(cacheKey, JSON.stringify(recommendations), this.CACHE_TTL);

        return recommendations;
      } catch (searchError) {
        // 如果搜索失败，使用数据库查询作为后备
        this.logger.warn('Meilisearch failed, using database fallback');
        return this.getRecommendedResumesFromDatabase(job, appliedResumeIds, limit);
      }
    } catch (error) {
      this.logger.error(`获取职位推荐简历失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 从数据库获取推荐简历（后备方案）
   */
  private async getRecommendedResumesFromDatabase(
    job: Job,
    excludeIds: string[],
    limit: number,
  ): Promise<ResumeRecommendation[]> {
    const query = this.resumeRepository.createQueryBuilder('resume')
      .leftJoinAndSelect('resume.user', 'user')
      .leftJoinAndSelect('resume.experiences', 'experiences')
      .leftJoinAndSelect('resume.educations', 'educations')
      .leftJoinAndSelect('resume.skills', 'skills')
      .where('resume.visibility = :visibility', { visibility: 'public' });

    if (excludeIds.length > 0) {
      query.andWhere('resume.id NOT IN (:...excludeIds)', { excludeIds });
    }

    query.take(limit);

    const resumes = await query.getMany();

    const recommendations: ResumeRecommendation[] = resumes.map(resume => {
      const score = this.calculateResumeJobMatch(resume, job);
      return {
        resume,
        score: score.overall,
        matchingFactors: score,
        explanation: this.generateExplanation(resume, job, score),
      };
    });

    recommendations.sort((a, b) => b.score - a.score);
    return recommendations;
  }

  /**
   * 为简历推荐职位
   */
  async getRecommendedJobsForResume(
    resumeId: string,
    userId: string,
    limit: number = 20,
  ): Promise<JobRecommendation[]> {
    try {
      const cacheKey = `resume:${resumeId}:recommended_jobs:${limit}`;
      
      // 检查缓存
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const resume = await this.resumeRepository.findOne({
        where: { id: resumeId },
        relations: [
          'user',
          'experiences',
          'educations',
          'skills',
          'projects',
        ],
      });

      if (!resume) {
        throw new Error('简历不存在');
      }

      // 检查权限
      if (resume.user_id !== userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user || ![UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER].includes(user.role)) {
          throw new Error('没有权限查看此简历的推荐职位');
        }
      }

      // 获取已经申请过的职位ID
      const existingApplications = await this.applicationRepository.find({
        where: { resume_id: resumeId },
        select: ['job_id'],
      });
      const appliedJobIds = existingApplications.map(app => app.job_id).filter(Boolean);

      // 搜索匹配的职位
      const searchParams = this.buildJobSearchParams(resume);
      try {
        const searchResult = await this.meilisearchService.search('jobs', searchParams.query || '', {
          filter: this.buildJobFilters(resume, appliedJobIds),
          limit,
          sort: ['priority:desc', 'updated_at:desc'],
        });

        // 获取完整的职位数据
        const jobIds = searchResult.hits.map((hit: any) => hit.id);
        const jobs = await this.jobRepository.find({
          where: { id: jobIds as any },
          relations: ['recruiter'],
        });

        // 计算匹配度
        const recommendations: JobRecommendation[] = jobs.map(job => {
          const score = this.calculateJobResumeMatch(job, resume);
          return {
            job,
            score: score.overall,
            matchingFactors: score,
            explanation: this.generateJobExplanation(job, resume, score),
          };
        });

        // 按分数排序
        recommendations.sort((a, b) => b.score - a.score);

        // 缓存结果
        await this.redisService.set(cacheKey, JSON.stringify(recommendations), this.CACHE_TTL);

        return recommendations;
      } catch (searchError) {
        this.logger.warn('Meilisearch failed, using database fallback');
        return this.getRecommendedJobsFromDatabase(resume, appliedJobIds, limit);
      }
    } catch (error) {
      this.logger.error(`获取简历推荐职位失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 从数据库获取推荐职位（后备方案）
   */
  private async getRecommendedJobsFromDatabase(
    resume: Resume,
    excludeIds: string[],
    limit: number,
  ): Promise<JobRecommendation[]> {
    const query = this.jobRepository.createQueryBuilder('job')
      .leftJoinAndSelect('job.recruiter', 'recruiter')
      .where('job.is_public = :isPublic', { isPublic: true })
      .andWhere('job.status = :status', { status: 'open' });

    if (excludeIds.length > 0) {
      query.andWhere('job.id NOT IN (:...excludeIds)', { excludeIds });
    }

    query.take(limit * 2);

    const jobs = await query.getMany();

    const recommendations: JobRecommendation[] = jobs.map(job => {
      const score = this.calculateJobResumeMatch(job, resume);
      return {
        job,
        score: score.overall,
        matchingFactors: score,
        explanation: this.generateJobExplanation(job, resume, score),
      };
    });

    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, limit);
  }

  /**
   * 为用户推荐职位（基于用户的所有简历）
   */
  async getRecommendedJobsForUser(userId: string, limit: number = 10): Promise<JobRecommendation[]> {
    try {
      const cacheKey = `user:${userId}:recommended_jobs:${limit}`;
      
      // 检查缓存
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // 获取用户的所有简历
      const resumes = await this.resumeRepository.find({
        where: { user_id: userId },
        relations: ['experiences', 'educations', 'skills'],
      });

      if (resumes.length === 0) {
        return [];
      }

      // 获取用户已经申请过的职位ID
      const existingApplications = await this.applicationRepository.find({
        where: { applicant: { id: userId } },
        select: ['job_id'],
      });
      const appliedJobIds = existingApplications.map(app => app.job_id).filter(Boolean);

      // 使用最完整的简历进行推荐
      const primaryResume = this.getPrimaryResume(resumes);
      const searchParams = this.buildJobSearchParams(primaryResume);
      
      let jobs: Job[];
      try {
        const searchResult = await this.meilisearchService.search('jobs', searchParams.query || '', {
          filter: this.buildJobFilters(primaryResume, appliedJobIds),
          limit: limit * 2,
          sort: ['priority:desc', 'updated_at:desc'],
        });

        // 获取完整的职位数据
        const jobIds = searchResult.hits.map((hit: any) => hit.id);
        jobs = await this.jobRepository.find({
          where: { id: jobIds as any },
          relations: ['recruiter'],
        });
      } catch (searchError) {
        this.logger.warn('Meilisearch failed, using database fallback');
        jobs = await this.jobRepository.find({
          where: { is_public: true },
          relations: ['recruiter'],
          order: { priority: 'DESC', created_at: 'DESC' },
          take: limit * 2,
        });
      }

      // 为每个简历计算匹配度，取最高分
      const recommendations: JobRecommendation[] = [];
      for (const job of jobs) {
        let bestScore = 0;
        let bestResume: Resume = primaryResume;
        let bestMatchFactors: any = { overall: 0 };

        for (const resume of resumes) {
          const score = this.calculateJobResumeMatch(job, resume);
          if (score.overall > bestScore) {
            bestScore = score.overall;
            bestResume = resume;
            bestMatchFactors = score;
          }
        }

        if (bestScore > 30) { // 阈值：30分以上才推荐
          recommendations.push({
            job,
            score: bestScore,
            matchingFactors: bestMatchFactors,
            explanation: this.generateJobExplanation(job, bestResume, bestMatchFactors),
          });
        }
      }

      // 按分数排序并限制数量
      recommendations.sort((a, b) => b.score - a.score);
      const finalRecommendations = recommendations.slice(0, limit);

      // 缓存结果
      await this.redisService.set(cacheKey, JSON.stringify(finalRecommendations), this.CACHE_TTL);

      return finalRecommendations;
    } catch (error) {
      this.logger.error(`获取用户推荐职位失败: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * 计算简历与职位的匹配度
   */
  private calculateResumeJobMatch(resume: Resume, job: Job): any {
    const totalExp = resume.experiences?.reduce((sum, exp) => sum + (exp.durationYears || 0), 0) || 0;

    const factors: any = {
      skills: { matched: [], score: 0 },
      experience: { years: totalExp, score: 0 },
      education: { matched: false, score: 0 },
      location: { matched: false, score: 0 },
      salary: { matchLevel: 'unknown', score: 0 },
      overall: 0,
    };

    // 技能匹配 (40分)
    const resumeSkills = resume.skills?.map(s => s.name.toLowerCase()) || [];
    const jobSkills = job.required_skills?.map((s: string) => s.toLowerCase()) 
      || job.skills?.map((s: string) => s.toLowerCase()) 
      || [];
    
    if (resumeSkills.length > 0 && jobSkills.length > 0) {
      const matchedSkills = resumeSkills.filter(skill => 
        jobSkills.some(jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill))
      );
      
      factors.skills.matched = matchedSkills;
      factors.skills.score = Math.min((matchedSkills.length / jobSkills.length) * 40, 40);
    }

    // 经验匹配 (20分)
    if (job.experience_min) {
      const requiredExp = job.experience_min;
      
      if (totalExp >= requiredExp) {
        factors.experience.score = 20;
      } else if (totalExp >= requiredExp * 0.7) {
        factors.experience.score = 15;
      } else if (totalExp >= requiredExp * 0.5) {
        factors.experience.score = 10;
      } else {
        factors.experience.score = 5;
      }
    } else {
      factors.experience.score = 10; // 无要求给基础分
    }

    // 学历匹配 (15分)
    if (job.education_level && resume.educations && resume.educations.length > 0) {
      factors.education.matched = true;
      factors.education.score = 15;
    } else if (!job.education_level) {
      factors.education.score = 5; // 无要求给基础分
    }

    // 地点匹配 (15分)
    if (job.location && resume.preferred_location) {
      const jobLoc = job.location.toLowerCase();
      const resumeLoc = resume.preferred_location.toLowerCase();
      
      if (jobLoc === resumeLoc) {
        factors.location.matched = true;
        factors.location.score = 15;
      } else if (this.isNearbyLocation(jobLoc, resumeLoc)) {
        factors.location.matched = true;
        factors.location.score = 10;
      } else if (job.is_remote) {
        factors.location.score = 15; // 远程工作
      }
    } else if (job.is_remote) {
      factors.location.score = 15;
    }

    // 薪资匹配 (10分)
    if (resume.expected_salary && job.salary_min && job.salary_max) {
      const expected = resume.expected_salary;
      const min = job.salary_min;
      const max = job.salary_max;
      
      if (expected >= min && expected <= max) {
        factors.salary.matchLevel = 'good';
        factors.salary.score = 10;
      } else if (expected < min) {
        factors.salary.matchLevel = 'low';
        factors.salary.score = 8;
      } else if (expected > max) {
        factors.salary.matchLevel = 'high';
        factors.salary.score = 5;
      }
    } else {
      factors.salary.score = 5; // 无明确信息给基础分
    }

    // 计算总分
    factors.overall = Object.values(factors)
      .filter(factor => typeof factor === 'object' && 'score' in factor)
      .reduce((sum: number, factor: any) => sum + factor.score, 0);

    return factors;
  }

  /**
   * 计算职位与简历的匹配度（反向计算）
   */
  private calculateJobResumeMatch(job: Job, resume: Resume): any {
    return this.calculateResumeJobMatch(resume, job);
  }

  /**
   * 构建简历搜索参数
   */
  private buildResumeSearchParams(job: Job): any {
    const queryParts = [];
    
    if (job.title) queryParts.push(job.title);
    const skills = job.required_skills || job.skills || [];
    if (skills.length > 0) {
      queryParts.push(...skills.slice(0, 3));
    }
    
    return {
      query: queryParts.join(' '),
    };
  }

  /**
   * 构建职位搜索参数
   */
  private buildJobSearchParams(resume: Resume): any {
    const queryParts = [];
    
    if (resume.current_position) queryParts.push(resume.current_position);
    if (resume.skills && resume.skills.length > 0) {
      queryParts.push(...resume.skills.slice(0, 3).map(s => s.name));
    }
    
    return {
      query: queryParts.join(' '),
    };
  }

  /**
   * 构建简历过滤器
   */
  private buildResumeFilters(job: Job, excludeIds: string[]): string[] {
    const filters: string[] = [
      'is_looking_for_job = true',
      'visibility = "public"',
    ];

    if (excludeIds.length > 0) {
      filters.push(`id NOT IN [${excludeIds.map(id => `"${id}"`).join(', ')}]`);
    }

    if (job.location && !job.is_remote) {
      filters.push(`location = "${job.location}"`);
    }

    if (job.experience_min) {
      filters.push(`total_experience >= ${job.experience_min}`);
    }

    return filters;
  }

  /**
   * 构建职位过滤器
   */
  private buildJobFilters(resume: Resume, excludeIds: string[]): string[] {
    const filters: string[] = [
      'is_public = true',
      'status = "open"',
    ];

    if (excludeIds.length > 0) {
      filters.push(`id NOT IN [${excludeIds.map(id => `"${id}"`).join(', ')}]`);
    }

    if (resume.preferred_location && resume.work_preference !== 'remote') {
      filters.push(`location = "${resume.preferred_location}"`);
    }

    if (resume.expected_salary && resume.salary_period === 'monthly') {
      // 薪资范围匹配
      filters.push(`salary_min <= ${resume.expected_salary * 1.2}`);
    }

    return filters;
  }

  /**
   * 获取主要简历（最完整的那份）
   */
  private getPrimaryResume(resumes: Resume[]): Resume {
    if (resumes.length === 1) return resumes[0];
    
    // 按完整度排序
    return resumes.sort((a, b) => {
      const scoreA = this.calculateResumeCompleteness(a);
      const scoreB = this.calculateResumeCompleteness(b);
      return scoreB - scoreA;
    })[0];
  }

  /**
   * 计算简历完整度
   */
  private calculateResumeCompleteness(resume: Resume): number {
    let score = 0;
    
    if (resume.full_name) score += 10;
    if (resume.email) score += 10;
    if (resume.current_position) score += 10;
    if (resume.experiences && resume.experiences.length > 0) score += 30;
    if (resume.educations && resume.educations.length > 0) score += 20;
    if (resume.skills && resume.skills.length > 0) score += 20;
    
    return score;
  }

  /**
   * 获取学历等级
   */
  private getEducationLevel(degree: string): number {
    const levels: Record<string, number> = {
      '博士': 5,
      '硕士': 4,
      '本科': 3,
      '大专': 2,
      '高中': 1,
      '其他': 0,
    };
    
    return levels[degree] || 0;
  }

  /**
   * 判断是否附近地点
   */
  private isNearbyLocation(loc1: string, loc2: string): boolean {
    // 简化的地点匹配逻辑
    const cities: Record<string, string[]> = {
      '北京': ['北京', '北京市', 'beijing'],
      '上海': ['上海', '上海市', 'shanghai'],
      '广州': ['广州', '广州市', 'guangzhou'],
      '深圳': ['深圳', '深圳市', 'shenzhen'],
      '杭州': ['杭州', '杭州市', 'hangzhou'],
    };
    
    return Object.values(cities).some(cityGroup => 
      cityGroup.includes(loc1) && cityGroup.includes(loc2)
    );
  }

  /**
   * 生成解释文本
   */
  private generateExplanation(resume: Resume, job: Job, factors: any): string {
    const reasons: string[] = [];
    const totalExp = resume.experiences?.reduce((sum, exp) => sum + (exp.durationYears || 0), 0) || 0;
    
    if (factors.skills.score > 20) {
      reasons.push(`技能匹配度高（${factors.skills.matched.length}项匹配）`);
    }
    
    if (factors.experience.score > 15) {
      reasons.push(`经验符合要求（${totalExp}年经验）`);
    }
    
    if (factors.location.score > 10) {
      reasons.push('工作地点匹配');
    }
    
    if (factors.salary.score > 8) {
      reasons.push('薪资期望匹配');
    }
    
    if (reasons.length === 0) {
      reasons.push('基于综合评估推荐');
    }
    
    return `推荐理由：${reasons.join('，')}。匹配度 ${Math.round(factors.overall)}%。`;
  }

  /**
   * 生成职位解释文本
   */
  private generateJobExplanation(job: Job, resume: Resume, factors: any): string {
    const reasons: string[] = [];
    const totalExp = resume.experiences?.reduce((sum, exp) => sum + (exp.durationYears || 0), 0) || 0;
    
    if (factors.skills.score > 20) {
      reasons.push(`技能要求匹配（${factors.skills.matched.length}项技能）`);
    }
    
    if (factors.experience.score > 15) {
      reasons.push(`经验要求符合（需要${job.experience_min || '若干'}年，你有${totalExp}年）`);
    }
    
    if (factors.location.score > 10) {
      reasons.push('工作地点合适');
    }
    
    if (factors.salary.score > 8) {
      reasons.push('薪资范围匹配');
    }
    
    if (reasons.length === 0) {
      reasons.push('基于你的背景和职位要求推荐');
    }
    
    return `推荐理由：${reasons.join('，')}。匹配度 ${Math.round(factors.overall)}%。`;
  }

  /**
   * 清除缓存
   */
  async clearCache(userId?: string): Promise<void> {
    if (userId) {
      const pattern = `*user:${userId}:*`;
      await this.redisService.delPattern(pattern);
    } else {
      const pattern = '*recommended_*';
      await this.redisService.delPattern(pattern);
    }
    
    this.logger.log('推荐缓存已清除');
  }
}

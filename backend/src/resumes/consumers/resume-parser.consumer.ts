import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resume } from '../entities/resume.entity';
import { ResumeExperience } from '../entities/resume-experience.entity';
import { ResumeEducation, EducationDegree } from '../entities/resume-education.entity';
import { ResumeSkill, SkillLevel } from '../entities/resume-skill.entity';
import { ResumeProject } from '../entities/resume-project.entity';
import { ResumeParserService, ResumeParseResult } from '../services/resume-parser.service';
import { ResumeParserQueueService, ResumeParseJobData } from '../services/resume-parser-queue.service';
import { MeilisearchService } from '../../common/meilisearch/meilisearch.service';

@Processor('resume-parser')
@Injectable()
export class ResumeParserConsumer {
  private readonly logger = new Logger(ResumeParserConsumer.name);

  constructor(
    @InjectRepository(Resume)
    private readonly resumeRepository: Repository<Resume>,
    @InjectRepository(ResumeExperience)
    private readonly experienceRepository: Repository<ResumeExperience>,
    @InjectRepository(ResumeEducation)
    private readonly educationRepository: Repository<ResumeEducation>,
    @InjectRepository(ResumeSkill)
    private readonly skillRepository: Repository<ResumeSkill>,
    @InjectRepository(ResumeProject)
    private readonly projectRepository: Repository<ResumeProject>,
    private readonly resumeParserService: ResumeParserService,
    private readonly meilisearchService: MeilisearchService,
  ) {}

  @Process('parse-resume')
  async handleResumeParse(job: Job<ResumeParseJobData>): Promise<void> {
    const { resumeId, userId, fileUrl, fileName, fileType, fileSize, fileHash } = job.data;
    
    this.logger.log(`开始处理简历解析任务: ${resumeId}`);
    
    try {
      // 1. 更新简历状态为解析中
      await this.resumeRepository.update(resumeId, {
        parsing_status: 'processing',
        updated_at: new Date(),
      });

      // 2. 解析简历文件
      const parseResult = await this.resumeParserService.parseResume(
        fileUrl,
        fileType,
        userId,
      );

      // 3. 验证解析结果
      const validation = this.resumeParserService.validateResumeData(parseResult.data);
      if (!validation.isValid) {
        this.logger.warn(`简历数据不完整: ${resumeId}, 缺少字段: ${validation.missingFields.join(', ')}`);
      }

      // 4. 保存解析结果到数据库
      await this.saveParseResult(resumeId, parseResult);

      // 5. 更新简历状态
      await this.resumeRepository.update(resumeId, {
        parsing_status: parseResult.success ? 'completed' : 'failed',
        parsed_data: parseResult.data as any,
        parsed_at: new Date(),
        parsing_confidence: parseResult.confidence,
        is_verified: parseResult.success && parseResult.confidence > 70,
        updated_at: new Date(),
        last_updated_at: new Date(),
      });

      // 6. 索引到Meilisearch
      if (parseResult.success) {
        await this.indexResumeToSearch(resumeId);
      }

      // 7. 更新任务进度
      await job.progress(100);

      this.logger.log(`简历解析完成: ${resumeId}, 置信度: ${parseResult.confidence}%`);
      
    } catch (error) {
      this.logger.error(`简历解析失败: ${resumeId}`, error.stack);
      
      // 更新简历状态为失败
      await this.resumeRepository.update(resumeId, {
        parsing_status: 'failed',
        updated_at: new Date(),
      });

      // 记录失败原因
      await job.moveToFailed({
        message: error.message,
      }, true);

      throw error;
    }
  }

  /**
   * 保存解析结果到数据库
   */
  private async saveParseResult(resumeId: string, parseResult: ResumeParseResult): Promise<void> {
    if (!parseResult.success) return;

    const { data } = parseResult;
    const resume = await this.resumeRepository.findOne({ where: { id: resumeId } });

    if (!resume) {
      throw new Error(`找不到简历: ${resumeId}`);
    }

    // 保存工作经历
    if (data.experiences && data.experiences.length > 0) {
      const experiences = data.experiences.map(exp => {
        const entity = new ResumeExperience();
        entity.resume = resume;
        entity.company = exp.company;
        entity.position = exp.position;
        entity.start_date = new Date(exp.startDate);
        entity.end_date = exp.endDate ? new Date(exp.endDate) : undefined;
        entity.description = exp.description;
        entity.is_current = exp.isCurrent || false;
        return entity;
      });

      await this.experienceRepository.save(experiences);
    }

    // 保存教育背景
    if (data.educations && data.educations.length > 0) {
      const educations = data.educations.map(edu => {
        const entity = new ResumeEducation();
        entity.resume = resume;
        entity.institution = edu.school;
        entity.degree = edu.degree as EducationDegree;
        entity.field_of_study = edu.major;
        entity.start_date = new Date(edu.startDate);
        entity.end_date = edu.endDate ? new Date(edu.endDate) : undefined;
        entity.gpa = edu.gpa?.toString();
        return entity;
      });

      await this.educationRepository.save(educations);
    }

    // 保存技能
    if (data.skills && data.skills.length > 0) {
      const skills = data.skills.map(skill => {
        const entity = new ResumeSkill();
        entity.resume = resume;
        entity.name = skill.name;
        entity.level = (skill.level as SkillLevel) || SkillLevel.INTERMEDIATE;
        entity.years_of_experience = skill.years || 0;
        return entity;
      });

      await this.skillRepository.save(skills);
    }

    // 保存项目经验
    if (data.projects && data.projects.length > 0) {
      const projects = data.projects.map(project => {
        const entity = new ResumeProject();
        entity.resume = resume;
        entity.name = project.name;
        entity.role = project.role;
        entity.description = project.description;
        entity.technologies = project.technologies;
        entity.start_date = new Date(project.startDate);
        entity.end_date = project.endDate ? new Date(project.endDate) : null;
        return entity;
      });

      await this.projectRepository.save(projects);
    }
  }

  /**
   * 将简历索引到Meilisearch
   */
  private async indexResumeToSearch(resumeId: string): Promise<void> {
    try {
      const resume = await this.resumeRepository.findOne({
        where: { id: resumeId },
        relations: [
          'experiences',
          'educations',
          'skills',
          'projects',
          'user',
        ],
      });

      if (!resume || resume.visibility !== 'public') {
        return; // 私有简历不索引
      }

      // 准备索引数据
      const searchDocument = {
        id: resume.id,
        title: resume.title,
        summary: resume.summary,
        full_name: resume.full_name,
        email: resume.email,
        phone: resume.phone,
        location: resume.location,
        current_position: resume.current_position,
        current_company: resume.current_company,
        expected_salary: resume.expected_salary,
        preferred_location: resume.preferred_location,
        preferred_industries: resume.preferred_industries,
        preferred_positions: resume.preferred_positions,
        is_looking_for_job: resume.is_looking_for_job,
        work_preference: resume.work_preference,
        
        // 关联数据
        experiences: resume.experiences?.map(exp => ({
          company: exp.company,
          position: exp.position,
          description: exp.description,
        })) || [],
        
        educations: resume.educations?.map(edu => ({
          school: edu.institution,
          degree: edu.degree,
          major: edu.field_of_study,
        })) || [],
        
        skills: resume.skills?.map(skill => skill.name) || [],
        
        projects: resume.projects?.map(project => project.name) || [],
        
        // 元数据
        user_id: resume.user_id,
        created_at: resume.created_at,
        updated_at: resume.updated_at,
        match_score: resume.match_score,
        total_experience: resume.total_experience,
      };

      // 索引到Meilisearch
      await this.meilisearchService.addOrUpdateDocuments('resumes', [searchDocument]);

      this.logger.log(`简历已索引到搜索: ${resumeId}`);
    } catch (error) {
      this.logger.error(`简历索引失败: ${resumeId}`, error);
      // 索引失败不影响主要业务流程
    }
  }

  /**
   * 处理简历解析完成事件
   */
  @Process('resume-parse-completed')
  async handleParseCompleted(job: Job<{ resumeId: string; userId: string }>): Promise<void> {
    const { resumeId, userId } = job.data;
    
    this.logger.log(`简历解析后处理: ${resumeId}`);

    try {
      // 这里可以添加解析后的额外处理逻辑，例如：
      // 1. 发送通知给用户
      // 2. 触发简历推荐计算
      // 3. 更新用户统计数据
      // 4. 检查简历完整性并提示用户补充

      // 示例：计算简历完整度评分
      const resume = await this.resumeRepository.findOne({
        where: { id: resumeId },
        relations: ['experiences', 'educations', 'skills', 'projects'],
      });

      if (resume) {
        const completeness = this.calculateResumeCompleteness(resume);
        this.logger.log(`简历完整度评分: ${resumeId} - ${completeness}%`);
      }

      await job.progress(100);
    } catch (error) {
      this.logger.error(`简历解析后处理失败: ${resumeId}`, error);
      // 后处理失败不影响主要业务
    }
  }

  /**
   * 计算简历完整度
   */
  private calculateResumeCompleteness(resume: Resume): number {
    let score = 0;
    const maxScore = 100;

    // 基础信息 (40分)
    if (resume.full_name) score += 10;
    if (resume.email) score += 10;
    if (resume.phone) score += 5;
    if (resume.location) score += 5;
    if (resume.current_position) score += 5;
    if (resume.current_company) score += 5;

    // 工作经历 (30分)
    if (resume.experiences && resume.experiences.length > 0) {
      score += Math.min(resume.experiences.length * 5, 20);
      // 检查是否有当前工作
      const hasCurrentJob = resume.experiences.some(exp => exp.is_current);
      if (hasCurrentJob) score += 10;
    }

    // 教育背景 (15分)
    if (resume.educations && resume.educations.length > 0) {
      score += Math.min(resume.educations.length * 5, 15);
    }

    // 技能 (15分)
    if (resume.skills && resume.skills.length > 0) {
      score += Math.min(resume.skills.length * 3, 15);
    }

    return Math.min(score, maxScore);
  }
}
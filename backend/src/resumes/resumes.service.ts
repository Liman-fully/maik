import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resume, ResumeStatus, ResumeVisibility, ResumeSource } from './entities/resume.entity';
import { ResumeExperience } from './entities/resume-experience.entity';
import { ResumeEducation } from './entities/resume-education.entity';
import { ResumeSkill } from './entities/resume-skill.entity';
import { ResumeProject } from './entities/resume-project.entity';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { ResumeParserService } from './services/resume-parser.service';
import { ResumeParserQueueService } from './services/resume-parser-queue.service';
import { ResumeSearchService } from './services/resume-search.service';
import { MeilisearchService } from '../common/meilisearch/meilisearch.service';

@Injectable()
export class ResumesService {
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
    private readonly resumeParserQueueService: ResumeParserQueueService,
    private readonly resumeSearchService: ResumeSearchService,
    private readonly meilisearchService: MeilisearchService,
  ) {}

  /**
   * 创建简历
   */
  async create(createResumeDto: CreateResumeDto, userId: string): Promise<Resume> {
    const resume = this.resumeRepository.create({
      ...createResumeDto,
      user_id: userId,
      status: ResumeStatus.ACTIVE,
      source: ResumeSource.MANUAL,
    });

    const savedResume = await this.resumeRepository.save(resume);

    // 如果是公开简历，索引到搜索
    if (savedResume.visibility === ResumeVisibility.PUBLIC) {
      await this.indexResumeToSearch(savedResume.id);
    }

    return savedResume;
  }

  /**
   * 上传并解析简历文件
   */
  async uploadAndParseResume(
    file: any,
    title: string,
    visibility: string,
    userId: string,
  ): Promise<Resume> {
    // TODO: 实际项目中应该上传到腾讯云COS
    // 这里模拟文件上传
    
    // 生成文件hash（简化处理）
    const fileHash = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建简历记录
    const resume = this.resumeRepository.create({
      title: title || file.originalname,
      file_url: `/uploads/${fileHash}`, // 模拟文件URL
      file_name: file.originalname,
      file_size: file.size,
      file_type: file.mimetype,
      original_file_hash: fileHash,
      visibility: visibility as ResumeVisibility,
      status: ResumeStatus.ACTIVE,
      source: ResumeSource.UPLOAD,
      parsing_status: 'queued',
      user_id: userId,
    });

    const savedResume = await this.resumeRepository.save(resume);

    // 添加解析任务到队列
    await this.resumeParserQueueService.addResumeParseJob({
      resumeId: savedResume.id,
      userId,
      fileUrl: savedResume.file_url,
      fileName: savedResume.file_name,
      fileType: savedResume.file_type || '',
      fileSize: savedResume.file_size || 0,
      fileHash: savedResume.original_file_hash || '',
      priority: 'normal',
    });

    return savedResume;
  }

  /**
   * 获取简历列表
   */
  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: any,
  ): Promise<{ data: Resume[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const query = this.resumeRepository.createQueryBuilder('resume')
      .where('resume.user_id = :userId', { userId })
      .leftJoinAndSelect('resume.experiences', 'experiences')
      .leftJoinAndSelect('resume.educations', 'educations')
      .leftJoinAndSelect('resume.skills', 'skills')
      .leftJoinAndSelect('resume.projects', 'projects')
      .orderBy('resume.updated_at', 'DESC');

    // 应用过滤器
    if (filters) {
      if (filters.status) {
        query.andWhere('resume.status = :status', { status: filters.status });
      }
      if (filters.visibility) {
        query.andWhere('resume.visibility = :visibility', { visibility: filters.visibility });
      }
    }

    const [data, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取公开简历列表
   */
  async findPublicResumes(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Resume[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const query = this.resumeRepository.createQueryBuilder('resume')
      .where('resume.visibility = :visibility', { visibility: ResumeVisibility.PUBLIC })
      .andWhere('resume.status = :status', { status: ResumeStatus.ACTIVE })
      .andWhere('resume.is_looking_for_job = :looking', { looking: true })
      .leftJoinAndSelect('resume.user', 'user')
      .leftJoinAndSelect('resume.experiences', 'experiences')
      .leftJoinAndSelect('resume.educations', 'educations')
      .orderBy('resume.updated_at', 'DESC');

    const [data, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取用户简历列表
   */
  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Resume[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.resumeRepository.findAndCount({
      where: { user_id: userId },
      relations: ['experiences', 'educations', 'skills', 'projects'],
      order: { updated_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取单个简历
   */
  async findOne(id: string, userId: string): Promise<Resume> {
    const resume = await this.resumeRepository.findOne({
      where: { id },
      relations: [
        'experiences',
        'educations',
        'skills',
        'projects',
        'user',
      ],
    });

    if (!resume) {
      throw new NotFoundException('简历不存在');
    }

    // 检查权限：用户只能查看自己的简历或公开简历
    if (resume.user_id !== userId && resume.visibility !== ResumeVisibility.PUBLIC) {
      throw new ForbiddenException('没有权限查看此简历');
    }

    // 更新查看统计（如果是公开简历）
    if (resume.visibility === ResumeVisibility.PUBLIC) {
      await this.resumeRepository.update(id, {
        view_count: resume.view_count + 1,
        last_viewed_at: new Date(),
      });
    }

    return resume;
  }

  /**
   * 更新简历
   */
  async update(id: string, updateResumeDto: UpdateResumeDto, userId: string): Promise<Resume> {
    const resume = await this.findOne(id, userId);

    // 检查是否为自己的简历
    if (resume.user_id !== userId) {
      throw new ForbiddenException('只能修改自己的简历');
    }

    // 更新简历
    const updatedResume = await this.resumeRepository.save({
      ...resume,
      ...updateResumeDto,
      id,
      updated_at: new Date(),
      last_updated_at: new Date(),
    });

    // 如果可见性发生变化，更新搜索索引
    if (updateResumeDto.visibility && updateResumeDto.visibility !== resume.visibility) {
      if (updateResumeDto.visibility === ResumeVisibility.PUBLIC) {
        await this.indexResumeToSearch(id);
      } else {
        await this.removeResumeFromSearch(id);
      }
    }

    return updatedResume;
  }

  /**
   * 删除简历
   */
  async remove(id: string, userId: string): Promise<void> {
    const resume = await this.findOne(id, userId);

    // 检查是否为自己的简历
    if (resume.user_id !== userId) {
      throw new ForbiddenException('只能删除自己的简历');
    }

    // 软删除：更新状态
    await this.resumeRepository.update(id, {
      status: ResumeStatus.DELETED,
      updated_at: new Date(),
    });

    // 从搜索索引中移除
    await this.removeResumeFromSearch(id);
  }

  /**
   * 更新简历可见性
   */
  async updateVisibility(id: string, visibility: ResumeVisibility, userId: string): Promise<Resume> {
    const resume = await this.findOne(id, userId);

    if (resume.user_id !== userId) {
      throw new ForbiddenException('只能修改自己的简历');
    }

    const updatedResume = await this.resumeRepository.save({
      ...resume,
      visibility,
      updated_at: new Date(),
    });

    // 更新搜索索引
    if (visibility === ResumeVisibility.PUBLIC) {
      await this.indexResumeToSearch(id);
    } else {
      await this.removeResumeFromSearch(id);
    }

    return updatedResume;
  }

  /**
   * 刷新简历活跃时间
   */
  async refreshResume(id: string, userId: string): Promise<Resume> {
    const resume = await this.findOne(id, userId);

    if (resume.user_id !== userId) {
      throw new ForbiddenException('只能刷新自己的简历');
    }

    const updatedResume = await this.resumeRepository.save({
      ...resume,
      last_updated_at: new Date(),
      updated_at: new Date(),
    });

    return updatedResume;
  }

  /**
   * 获取推荐简历
   */
  async getRecommendedResumes(userId: string, limit: number = 10): Promise<Resume[]> {
    // TODO: 实现智能推荐算法
    // 现在先返回一些公开的活跃简历

    return this.resumeRepository.find({
      where: {
        visibility: ResumeVisibility.PUBLIC,
        status: ResumeStatus.ACTIVE,
        is_looking_for_job: true,
      },
      relations: ['user', 'experiences', 'educations'],
      order: { match_score: 'DESC', updated_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * 索引简历到搜索
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

      if (!resume || resume.status !== ResumeStatus.ACTIVE) {
        return;
      }

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
        user_id: resume.user_id,
        created_at: resume.created_at,
        updated_at: resume.updated_at,
        match_score: resume.match_score,
        total_experience: resume.total_experience,
      };

      await this.meilisearchService.addOrUpdateDocuments('resumes', [searchDocument]);
    } catch (error) {
      // 索引失败不影响主要业务
      console.error('简历索引失败:', error);
    }
  }

  /**
   * 从搜索索引中移除简历
   */
  private async removeResumeFromSearch(resumeId: string): Promise<void> {
    try {
      await this.meilisearchService.deleteDocuments('resumes', [resumeId]);
    } catch (error) {
      // 移除失败不影响主要业务
      console.error('简历移除索引失败:', error);
    }
  }

  /**
   * 统计用户简历数量
   */
  async getUserResumeStats(userId: string): Promise<{
    total: number;
    public: number;
    private: number;
    active: number;
    draft: number;
    verified: number;
  }> {
    const stats = await this.resumeRepository
      .createQueryBuilder('resume')
      .select('resume.visibility', 'visibility')
      .addSelect('resume.status', 'status')
      .addSelect('resume.is_verified', 'is_verified')
      .addSelect('COUNT(*)', 'count')
      .where('resume.user_id = :userId', { userId })
      .andWhere('resume.status != :deleted', { deleted: ResumeStatus.DELETED })
      .groupBy('resume.visibility, resume.status, resume.is_verified')
      .getRawMany();

    let total = 0;
    let publicCount = 0;
    let privateCount = 0;
    let activeCount = 0;
    let draftCount = 0;
    let verifiedCount = 0;

    for (const stat of stats) {
      total += parseInt(stat.count);
      
      if (stat.visibility === ResumeVisibility.PUBLIC) {
        publicCount += parseInt(stat.count);
      } else {
        privateCount += parseInt(stat.count);
      }

      if (stat.status === ResumeStatus.ACTIVE) {
        activeCount += parseInt(stat.count);
      } else if (stat.status === ResumeStatus.DRAFT) {
        draftCount += parseInt(stat.count);
      }

      if (stat.is_verified === true) {
        verifiedCount += parseInt(stat.count);
      }
    }

    return {
      total,
      public: publicCount,
      private: privateCount,
      active: activeCount,
      draft: draftCount,
      verified: verifiedCount,
    };
  }
}
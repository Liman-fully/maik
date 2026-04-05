import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Job, JobStatus, JobType, JobPriority } from '../entities/job.entity';
import { JobApplication } from '../entities/job-application.entity';
import { CreateJobDto } from '../dto/create-job.dto';
import { UpdateJobDto } from '../dto/update-job.dto';
import { User, UserRole } from '../../users/entities/user.entity';
import { MeilisearchService } from '../../common/meilisearch/meilisearch.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(JobApplication)
    private readonly applicationRepository: Repository<JobApplication>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly meilisearchService: MeilisearchService,
  ) {}

  /**
   * 创建职位
   */
  async create(createJobDto: CreateJobDto, userId: string): Promise<Job> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查用户是否有权限创建职位
    if (![UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN].includes(user.role)) {
      throw new ForbiddenException('没有权限创建职位');
    }

    // 转换 DTO 到 entity 格式
    const jobData: Partial<Job> = {
      ...createJobDto,
      recruiter_id: userId,
      recruiter: user,
      status: createJobDto.status || JobStatus.DRAFT,
      type: createJobDto.type || JobType.FULL_TIME,
      priority: createJobDto.priority || JobPriority.MEDIUM,
      is_public: createJobDto.is_public !== false, // 默认公开
      // 将 requirements DTO 转换为 string[]
      requirements: createJobDto.requirements?.skills || [],
    };

    const job = this.jobRepository.create(jobData);
    const savedJob = await this.jobRepository.save(job);

    // 如果职位是公开的，索引到搜索
    if (savedJob.is_public) {
      await this.indexJobToSearch(savedJob.id);
    }

    return savedJob;
  }

  /**
   * 获取职位列表
   */
  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: any,
  ): Promise<{ data: Job[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const user = await this.userRepository.findOne({ where: { id: userId } });

    const query = this.jobRepository.createQueryBuilder('job')
      .leftJoinAndSelect('job.recruiter', 'recruiter')
      .leftJoinAndSelect('job.applications', 'applications')
      .orderBy('job.updated_at', 'DESC');

    // 如果不是管理员/HR/Recruiter，只能查看公开职位
    if (![UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER].includes(user.role)) {
      query.andWhere('job.is_public = :isPublic', { isPublic: true })
        .andWhere('job.status = :status', { status: JobStatus.OPEN });
    } else {
      // 如果是招聘人员，可以看到自己发布的职位
      query.andWhere('job.recruiter_id = :userId OR job.is_public = :isPublic', {
        userId,
        isPublic: true,
      });
    }

    // 应用过滤器
    if (filters) {
      if (filters.status) {
        query.andWhere('job.status = :status', { status: filters.status });
      }
      if (filters.type) {
        query.andWhere('job.type = :type', { type: filters.type });
      }
      if (filters.location) {
        query.andWhere('job.location ILIKE :location', { location: `%${filters.location}%` });
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
   * 获取公开职位列表
   */
  async findPublicJobs(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Job[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.jobRepository.findAndCount({
      where: {
        is_public: true,
        status: JobStatus.OPEN,
      },
      relations: ['recruiter'],
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
   * 获取用户发布的职位列表
   */
  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Job[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.jobRepository.findAndCount({
      where: { recruiter_id: userId },
      relations: ['recruiter', 'applications'],
      order: { created_at: 'DESC' },
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
   * 获取单个职位
   */
  async findOne(id: string, userId: string): Promise<Job> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: [
        'recruiter',
        'applications',
        'applications.applicant',
      ],
    });

    if (!job) {
      throw new NotFoundException('职位不存在');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    // 检查权限：非公开职位只有发布者或管理员可以查看
    if (!job.is_public && user?.role !== UserRole.ADMIN) {
      if (job.recruiter_id !== userId) {
        throw new ForbiddenException('没有权限查看此职位');
      }
    }

    // 增加查看计数
    if (job.is_public) {
      await this.jobRepository.update(id, {
        views_count: (job.views_count || 0) + 1,
        last_viewed_at: new Date(),
      });
    }

    return job;
  }

  /**
   * 更新职位
   */
  async update(id: string, updateJobDto: UpdateJobDto, userId: string): Promise<Job> {
    const job = await this.findOne(id, userId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    // 检查权限：只有发布者或管理员可以更新
    if (job.recruiter_id !== userId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只能更新自己发布的职位');
    }

    // 检查职位状态是否可以更新
    if (job.status === JobStatus.CLOSED || job.status === JobStatus.FILLED) {
      throw new BadRequestException('已关闭或已填满的职位不能修改');
    }

    // 转换 DTO 到 entity 格式
    const updateData: Partial<Job> = {
      ...updateJobDto,
      requirements: updateJobDto.requirements?.skills || job.requirements,
    };

    const updatedJob = await this.jobRepository.save({
      ...job,
      ...updateData,
      id,
      updated_at: new Date(),
    });

    // 更新搜索索引
    if (updatedJob.is_public) {
      await this.indexJobToSearch(id);
    } else {
      await this.removeJobFromSearch(id);
    }

    return updatedJob;
  }

  /**
   * 删除职位
   */
  async remove(id: string, userId: string): Promise<void> {
    const job = await this.findOne(id, userId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    // 检查权限：只有发布者或管理员可以删除
    if (job.recruiter_id !== userId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只能删除自己发布的职位');
    }

    // 软删除：更新状态
    await this.jobRepository.update(id, {
      status: JobStatus.CANCELLED,
      updated_at: new Date(),
    });

    // 从搜索索引中移除
    await this.removeJobFromSearch(id);
  }

  /**
   * 更新职位状态
   */
  async updateStatus(id: string, status: JobStatus, userId: string): Promise<Job> {
    const job = await this.findOne(id, userId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    // 检查权限
    if (job.recruiter_id !== userId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只能修改自己发布的职位');
    }

    const updatedJob = await this.jobRepository.save({
      ...job,
      status,
      updated_at: new Date(),
    });

    // 更新搜索索引
    if (updatedJob.is_public && status === JobStatus.OPEN) {
      await this.indexJobToSearch(id);
    } else if (status !== JobStatus.OPEN) {
      await this.removeJobFromSearch(id);
    }

    return updatedJob;
  }

  /**
   * 获取职位申请人列表
   */
  async getJobApplicants(
    id: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: JobApplication[]; total: number; page: number; limit: number }> {
    const job = await this.findOne(id, userId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    // 检查权限
    if (job.recruiter_id !== userId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只能查看自己发布的职位的申请人');
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.applicationRepository.findAndCount({
      where: { job: { id } },
      relations: ['applicant', 'applicant.resumes'],
      order: { created_at: 'DESC' },
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
   * 获取推荐职位
   */
  async getRecommendedJobs(userId: string, limit: number = 10): Promise<Job[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['resumes'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // TODO: 实现智能推荐算法
    // 现在先返回一些公开的职位

    return this.jobRepository.find({
      where: {
        is_public: true,
        status: JobStatus.OPEN,
      },
      relations: ['recruiter'],
      order: { priority: 'DESC', created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取职位统计数据
   */
  async getJobStats(id: string, userId: string): Promise<any> {
    const job = await this.findOne(id, userId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    // 检查权限
    if (job.recruiter_id !== userId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只能查看自己发布的职位的统计数据');
    }

    // 获取申请统计
    const applications = await this.applicationRepository.find({
      where: { job: { id } },
    });

    const statusStats: Record<string, number> = {};
    applications.forEach(app => {
      statusStats[app.status as string] = (statusStats[app.status as string] || 0) + 1;
    });

    return {
      jobId: job.id,
      title: job.title,
      totalApplications: applications.length,
      statusStats,
      viewCount: job.views_count || 0,
      applicationRate: job.views_count ? (applications.length / job.views_count) * 100 : 0,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    };
  }

  /**
   * 刷新职位
   */
  async refreshJob(id: string, userId: string): Promise<Job> {
    const job = await this.findOne(id, userId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    // 检查权限
    if (job.recruiter_id !== userId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只能刷新自己发布的职位');
    }

    const updatedJob = await this.jobRepository.save({
      ...job,
      updated_at: new Date(),
      refreshed_at: new Date(),
    });

    return updatedJob;
  }

  /**
   * 索引职位到搜索
   */
  private async indexJobToSearch(jobId: string): Promise<void> {
    try {
      const job = await this.jobRepository.findOne({
        where: { id: jobId },
        relations: ['recruiter'],
      });

      if (!job || (job.status !== JobStatus.OPEN && job.status !== JobStatus.ACTIVE)) {
        return;
      }

      const searchDocument = {
        id: job.id,
        title: job.title,
        description: job.description,
        type: job.type,
        location: job.location,
        is_remote: job.is_remote,
        status: job.status,
        priority: job.priority,
        department: job.department,
        industry: job.industry,
        openings: job.openings,
        requirements: job.requirements,
        skills: job.skills,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        benefits: job.benefits,
        tags: job.tags,
        deadline: job.application_deadline,
        created_at: job.created_at,
        updated_at: job.updated_at,
        company_name: job.company_name || job.company,
        company_size: job.company_size,
        recruiter_id: job.recruiter_id,
      };

      await this.meilisearchService.addOrUpdateDocuments('jobs', [searchDocument]);
    } catch (error) {
      console.error('职位索引失败:', error);
    }
  }

  /**
   * 从搜索索引中移除职位
   */
  private async removeJobFromSearch(jobId: string): Promise<void> {
    try {
      await this.meilisearchService.deleteDocuments('jobs', jobId);
    } catch (error) {
      console.error('职位移除索引失败:', error);
    }
  }
}

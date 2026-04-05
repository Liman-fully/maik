import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Job, JobApplication, JobFavorite, JobStatus, ApplicationStatus } from './entities/job.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
    @InjectRepository(JobApplication)
    private applicationRepo: Repository<JobApplication>,
    @InjectRepository(JobFavorite)
    private favoriteRepo: Repository<JobFavorite>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async findAll(page: number, limit: number, filters: any) {
    const query = this.jobRepo.createQueryBuilder('job')
      .leftJoinAndSelect('job.recruiter', 'recruiter')
      .where('job.status = :status', { status: JobStatus.ACTIVE });

    if (filters.category) {
      query.andWhere('job.category = :category', { category: filters.category });
    }

    if (filters.location) {
      query.andWhere('job.location LIKE :location', { location: `%${filters.location}%` });
    }

    if (filters.keyword) {
      query.andWhere(
        '(job.title LIKE :keyword OR job.description LIKE :keyword OR job.company LIKE :keyword)',
        { keyword: `%${filters.keyword}%` }
      );
    }

    if (filters.salaryMin) {
      query.andWhere('job.salary_min >= :salaryMin', { salaryMin: parseInt(filters.salaryMin) });
    }

    if (filters.salaryMax) {
      query.andWhere('job.salary_max <= :salaryMax', { salaryMax: parseInt(filters.salaryMax) });
    }

    query.orderBy('job.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      items: items.map(job => ({
        ...job,
        recruiter: job.recruiter ? {
          id: job.recruiter.id,
          username: job.recruiter.username,
          company: job.recruiter.company,
          avatar_url: job.recruiter.avatar_url,
        } : null,
      })),
      total,
      page,
      limit,
      has_more: total > page * limit,
    };
  }

  async findByRecruiter(userId: string, page: number, limit: number) {
    const [items, total] = await this.jobRepo.findAndCount({
      where: { recruiter_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit, has_more: total > page * limit };
  }

  async findOne(id: string) {
    const job = await this.jobRepo.findOne({
      where: { id },
      relations: ['recruiter'],
    });

    if (!job) {
      throw new NotFoundException('职位不存在');
    }

    // 增加浏览次数
    job.views_count += 1;
    await this.jobRepo.save(job);

    return job;
  }

  async create(userId: string, data: any) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    
    // 检查权限
    if (user.role !== UserRole.HR && user.role !== UserRole.HEADHUNTER && user.role !== UserRole.ADMIN) {
      throw new BadRequestException('只有招聘者才能发布职位');
    }

    const job = this.jobRepo.create({
      ...data,
      recruiter_id: userId,
      company: data.company || user.company,
      status: JobStatus.DRAFT,
    });

    return this.jobRepo.save(job);
  }

  async update(id: string, data: any) {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException('职位不存在');
    }

    Object.assign(job, data);
    return this.jobRepo.save(job);
  }

  async remove(id: string) {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException('职位不存在');
    }

    await this.jobRepo.remove(job);
    return { success: true };
  }

  async apply(jobId: string, userId: string, resumeId: string, coverLetter?: string) {
    // 检查职位是否存在且活跃
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('职位不存在');
    }

    if (job.status !== JobStatus.ACTIVE) {
      throw new BadRequestException('该职位已暂停招聘');
    }

    // 检查是否已申请
    const existing = await this.applicationRepo.findOne({
      where: { job_id: jobId, applicant_id: userId },
    });

    if (existing) {
      throw new BadRequestException('您已申请过该职位');
    }

    // 创建申请
    const application = this.applicationRepo.create({
      job_id: jobId,
      applicant_id: userId,
      resume_id: resumeId,
      cover_letter: coverLetter,
    });

    await this.applicationRepo.save(application);

    // 更新职位申请人数
    job.applicants_count += 1;
    await this.jobRepo.save(job);

    return application;
  }

  async getApplications(jobId: string, page: number, limit: number) {
    const [items, total] = await this.applicationRepo.findAndCount({
      where: { job_id: jobId },
      relations: ['applicant'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map(app => ({
        ...app,
        applicant: app.applicant ? {
          id: app.applicant.id,
          username: app.applicant.username,
          email: app.applicant.email,
          avatar_url: app.applicant.avatar_url,
          position: app.applicant.position,
        } : null,
      })),
      total,
      page,
      limit,
      has_more: total > page * limit,
    };
  }

  async updateApplicationStatus(id: string, status: string, interviewInfo?: any) {
    const application = await this.applicationRepo.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException('申请不存在');
    }

    application.status = status as ApplicationStatus;
    
    if (status === 'viewed') {
      application.viewed_at = new Date();
    } else if (status === 'interviewed') {
      application.interviewed_at = new Date();
      application.interview_info = interviewInfo;
    }

    return this.applicationRepo.save(application);
  }

  async favorite(userId: string, jobId: string) {
    const existing = await this.favoriteRepo.findOne({
      where: { user_id: userId, job_id: jobId },
    });

    if (existing) {
      return { success: true, message: '已收藏' };
    }

    const favorite = this.favoriteRepo.create({
      user_id: userId,
      job_id: jobId,
    });

    await this.favoriteRepo.save(favorite);
    return { success: true };
  }

  async unfavorite(userId: string, jobId: string) {
    await this.favoriteRepo.delete({ user_id: userId, job_id: jobId });
    return { success: true };
  }

  async getFavorites(userId: string, page: number, limit: number) {
    const [favorites, total] = await this.favoriteRepo.findAndCount({
      where: { user_id: userId },
      relations: ['job'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: favorites.map(f => f.job).filter(Boolean),
      total,
      page,
      limit,
      has_more: total > page * limit,
    };
  }
}

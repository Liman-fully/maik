import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobApplication, ApplicationStatus, ApplicationSource } from '../entities/job-application.entity';
import { Job } from '../entities/job.entity';
import { User, UserRole } from '../../users/entities/user.entity';

@Injectable()
export class JobApplicationsService {
  constructor(
    @InjectRepository(JobApplication)
    private applicationRepository: Repository<JobApplication>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 创建申请
   */
  async create(data: any, userId?: string): Promise<JobApplication> {
    const application = this.applicationRepository.create({
      ...data,
      applicant_id: userId || data.applicant_id,
      applied_at: new Date(),
    });
    const saved = await this.applicationRepository.save(application);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  /**
   * 获取所有申请
   */
  async findAll(): Promise<JobApplication[]> {
    return this.applicationRepository.find();
  }

  /**
   * 根据ID获取申请
   */
  async findOne(id: string, userId?: string): Promise<JobApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['job', 'applicant', 'resume'],
    });

    if (!application) {
      throw new NotFoundException('申请不存在');
    }

    // 检查权限
    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const isOwner = application.applicant_id === userId;
      const isRecruiter = application.job?.recruiter_id === userId;
      const isAdmin = user?.role === UserRole.ADMIN;

      if (!isOwner && !isRecruiter && !isAdmin) {
        throw new ForbiddenException('没有权限查看此申请');
      }
    }

    return application;
  }

  /**
   * 根据用户获取申请
   */
  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: any,
  ): Promise<{ data: JobApplication[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const where: any = { applicant_id: userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    const [data, total] = await this.applicationRepository.findAndCount({
      where,
      relations: ['job', 'job.recruiter'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  /**
   * 根据招聘者获取申请
   */
  async findByRecruiter(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: any,
  ): Promise<{ data: JobApplication[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const query = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('application.applicant', 'applicant')
      .leftJoinAndSelect('application.resume', 'resume')
      .where('job.recruiter_id = :userId', { userId });

    if (filters?.status) {
      query.andWhere('application.status = :status', { status: filters.status });
    }

    if (filters?.jobId) {
      query.andWhere('job.id = :jobId', { jobId: filters.jobId });
    }

    query.orderBy('application.created_at', 'DESC');
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * 更新申请
   */
  async update(id: string, data: any, userId: string): Promise<JobApplication> {
    const application = await this.findOne(id, userId);

    await this.applicationRepository.update(id, {
      ...data,
      status_changed_at: new Date(),
    });

    return this.findOne(id, userId);
  }

  /**
   * 删除/撤回申请
   */
  async remove(id: string, userId: string): Promise<void> {
    const application = await this.findOne(id, userId);

    // 检查权限：只有申请者可以撤回
    if (application.applicant_id !== userId) {
      throw new ForbiddenException('只能撤回自己的申请');
    }

    await this.applicationRepository.update(id, {
      status: ApplicationStatus.WITHDRAWN,
      withdrawn_date: new Date(),
      status_changed_at: new Date(),
    });
  }

  /**
   * 撤回申请
   */
  async withdraw(id: string, userId: string): Promise<JobApplication> {
    const application = await this.findOne(id, userId);

    if (application.applicant_id !== userId) {
      throw new ForbiddenException('只能撤回自己的申请');
    }

    await this.applicationRepository.update(id, {
      status: ApplicationStatus.WITHDRAWN,
      withdrawn_date: new Date(),
      status_changed_at: new Date(),
    });

    return this.findOne(id, userId);
  }

  /**
   * 接受申请
   */
  async accept(id: string, userId: string): Promise<JobApplication> {
    const application = await this.findOne(id, userId);

    // 检查权限：只有招聘者可以接受
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (application.job.recruiter_id !== userId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只能接受自己发布职位的申请');
    }

    await this.applicationRepository.update(id, {
      status: ApplicationStatus.SHORTLISTED,
      status_changed_at: new Date(),
    });

    return this.findOne(id, userId);
  }

  /**
   * 拒绝申请
   */
  async reject(id: string, userId: string): Promise<JobApplication> {
    const application = await this.findOne(id, userId);

    // 检查权限：只有招聘者可以拒绝
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (application.job.recruiter_id !== userId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只能拒绝自己发布职位的申请');
    }

    await this.applicationRepository.update(id, {
      status: ApplicationStatus.REJECTED,
      rejected_date: new Date(),
      status_changed_at: new Date(),
    });

    return this.findOne(id, userId);
  }

  /**
   * 安排面试
   */
  async scheduleInterview(
    id: string,
    userId: string,
    interviewDate: Date,
    interviewType: string = 'online',
    interviewLink?: string,
    notes?: string,
  ): Promise<JobApplication> {
    const application = await this.findOne(id, userId);

    // 检查权限
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (application.job.recruiter_id !== userId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只能为自己发布职位的申请安排面试');
    }

    await this.applicationRepository.update(id, {
      status: ApplicationStatus.INTERVIEWING,
      interview_info: {
        type: interviewType,
        location: interviewLink,
        time: interviewDate,
        interviewer: user?.username || '招聘方',
        notes: notes,
      },
      first_interview_date: interviewDate,
      interviewed_at: new Date(),
      last_contacted_at: new Date(),
      status_changed_at: new Date(),
    });

    return this.findOne(id, userId);
  }

  /**
   * 发送录用通知
   */
  async sendOffer(id: string, userId: string, offerDetails: any): Promise<JobApplication> {
    const application = await this.findOne(id, userId);

    // 检查权限
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (application.job.recruiter_id !== userId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只能为自己发布职位的申请发送录用通知');
    }

    await this.applicationRepository.update(id, {
      status: ApplicationStatus.OFFERED,
      offered_salary: offerDetails.salary,
      offered_salary_currency: offerDetails.currency,
      offered_start_date: offerDetails.startDate,
      offer_notes: offerDetails.notes,
      offer_sent_date: new Date(),
      last_contacted_at: new Date(),
      status_changed_at: new Date(),
    });

    return this.findOne(id, userId);
  }

  /**
   * 获取用户申请统计
   */
  async getUserApplicationStats(userId: string): Promise<any> {
    const applications = await this.applicationRepository.find({
      where: { applicant_id: userId },
    });

    const stats: Record<string, number> = {
      total: applications.length,
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      interviewing: 0,
      offered: 0,
      hired: 0,
      rejected: 0,
      withdrawn: 0,
    };

    applications.forEach(app => {
      const status = app.status as string;
      if (stats[status] !== undefined) {
        stats[status]++;
      }
    });

    return stats;
  }

  /**
   * 获取职位申请统计
   */
  async getJobApplicationStats(jobId: string, userId: string): Promise<any> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });

    if (!job) {
      throw new NotFoundException('职位不存在');
    }

    // 检查权限
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (job.recruiter_id !== userId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只能查看自己发布职位的统计');
    }

    const applications = await this.applicationRepository.find({
      where: { job_id: jobId },
    });

    const stats: Record<string, number> = {
      total: applications.length,
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      interviewing: 0,
      offered: 0,
      hired: 0,
      rejected: 0,
      withdrawn: 0,
    };

    applications.forEach(app => {
      const status = app.status as string;
      if (stats[status] !== undefined) {
        stats[status]++;
      }
    });

    return {
      jobId,
      jobTitle: job.title,
      ...stats,
    };
  }
}

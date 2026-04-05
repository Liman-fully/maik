import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { JobApplication, ApplicationStatus } from '../recruiters/entities/job-application.entity';
import { Job } from '../recruiters/entities/job.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(JobApplication)
    private readonly applicationRepository: Repository<JobApplication>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getMyApplications(
    userId: string,
    page = 1,
    limit = 10,
    status?: string,
  ) {
    const where: any = { applicant_id: userId };
    if (status) {
      where.status = status as ApplicationStatus;
    }

    const [applications, total] = await this.applicationRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 批量获取关联的 Job 信息
    const jobIds = applications.map((a) => a.job_id);
    const jobs = jobIds.length
      ? await this.jobRepository.findByIds(jobIds)
      : [];
    const jobMap = new Map(jobs.map((j) => [j.id, j]));

    const items = applications.map((app) => {
      const job = jobMap.get(app.job_id);
      return {
        id: app.id,
        job_id: app.job_id,
        resume_id: app.resume_id,
        cover_letter: app.cover_letter,
        status: app.status,
        source: app.source,
        match_score: app.match_score,
        created_at: app.created_at,
        updated_at: app.updated_at,
        status_changed_at: app.status_changed_at,
        job: job
          ? {
              id: job.id,
              title: job.title,
              company_name: job.company_name,
              company_logo: job.company_logo,
              location: job.location,
              salary_min: job.salary_min,
              salary_max: job.salary_max,
              salary_currency: job.salary_currency,
              job_type: job.type,
              status: job.status,
              experience_min: job.experience_min,
              education_level: job.education_level,
            }
          : null,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      has_more: page * limit < total,
    };
  }

  async withdraw(userId: string, applicationId: string) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('申请记录不存在');
    }

    if (application.applicant_id !== userId) {
      throw new BadRequestException('只能撤回自己的申请');
    }

    if (application.status === ApplicationStatus.WITHDRAWN) {
      throw new BadRequestException('该申请已被撤回');
    }

    // 终态不可撤回
    const finalStatuses = [
      ApplicationStatus.HIRED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.ARCHIVED,
    ];
    if (finalStatuses.includes(application.status)) {
      throw new BadRequestException('该申请已处于终态，无法撤回');
    }

    application.updateStatus(ApplicationStatus.WITHDRAWN);
    application.withdrawal_reason = '用户主动撤回';
    application.withdrawn_date = new Date();

    return this.applicationRepository.save(application);
  }
}

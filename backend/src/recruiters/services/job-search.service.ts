import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between } from 'typeorm';
import { Job, JobStatus } from '../entities/job.entity';
import { MeilisearchService } from '../../common/meilisearch/meilisearch.service';

export interface SearchJobsParams {
  query?: string;
  location?: string;
  type?: string;
  industry?: string;
  minSalary?: number;
  maxSalary?: number;
}

@Injectable()
export class JobSearchService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    private readonly meilisearchService: MeilisearchService,
  ) {}

  /**
   * 搜索职位
   */
  async searchJobs(
    params: SearchJobsParams,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Job[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    // 首先尝试使用 Meilisearch
    try {
      const filters: string[] = [
        'is_public = true',
        'status = "open"',
      ];

      if (params.location) {
        filters.push(`location = "${params.location}"`);
      }

      if (params.type) {
        filters.push(`type = "${params.type}"`);
      }

      if (params.minSalary) {
        filters.push(`salary_min >= ${params.minSalary}`);
      }

      if (params.maxSalary) {
        filters.push(`salary_max <= ${params.maxSalary}`);
      }

      const searchResult = await this.meilisearchService.search('jobs', params.query || '', {
        filter: filters,
        limit,
        offset: skip,
      });

      if (searchResult.hits && searchResult.hits.length > 0) {
        const jobIds = searchResult.hits.map((hit: any) => hit.id);
        const jobs = await this.jobRepository.find({
          where: { id: jobIds as any },
          relations: ['recruiter'],
        });

        // 保持搜索结果的顺序
        const orderedJobs = jobIds.map((id: string) => jobs.find(job => job.id === id)).filter(Boolean);

        return {
          data: orderedJobs as Job[],
          total: searchResult.estimatedTotalHits || searchResult.hits.length,
          page,
          limit,
        };
      }
    } catch (error) {
      console.error('Meilisearch search failed, falling back to database:', error);
    }

    // 回退到数据库搜索
    const query = this.jobRepository.createQueryBuilder('job')
      .leftJoinAndSelect('job.recruiter', 'recruiter')
      .where('job.is_public = :isPublic', { isPublic: true })
      .andWhere('job.status = :status', { status: JobStatus.OPEN });

    if (params.query) {
      query.andWhere(
        '(job.title ILIKE :query OR job.description ILIKE :query OR job.company ILIKE :query OR job.company_name ILIKE :query)',
        { query: `%${params.query}%` },
      );
    }

    if (params.location) {
      query.andWhere('job.location ILIKE :location', { location: `%${params.location}%` });
    }

    if (params.type) {
      query.andWhere('job.type = :type', { type: params.type });
    }

    if (params.industry) {
      query.andWhere('job.industry ILIKE :industry', { industry: `%${params.industry}%` });
    }

    if (params.minSalary) {
      query.andWhere('job.salary_min >= :minSalary', { minSalary: params.minSalary });
    }

    if (params.maxSalary) {
      query.andWhere('job.salary_max <= :maxSalary', { maxSalary: params.maxSalary });
    }

    query.orderBy('job.priority', 'DESC')
      .addOrderBy('job.created_at', 'DESC');

    const [data, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * 获取推荐职位
   */
  async getRecommendations(jobId: string): Promise<Job[]> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });

    if (!job) {
      return [];
    }

    // 基于相同类型和地点推荐
    return this.jobRepository.find({
      where: {
        type: job.type,
        status: JobStatus.OPEN,
        is_public: true,
      },
      relations: ['recruiter'],
      order: { priority: 'DESC', created_at: 'DESC' },
      take: 10,
    });
  }
}

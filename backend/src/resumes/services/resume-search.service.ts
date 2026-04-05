import { Injectable, Logger } from '@nestjs/common';
import { MeilisearchService } from '../../common/meilisearch/meilisearch.service';
import { Resume } from '../entities/resume.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResumeVisibility, ResumeStatus } from '../entities/resume.entity';

export interface ResumeSearchParams {
  query?: string;
  location?: string;
  position?: string;
  skills?: string[];
  minSalary?: number;
  maxSalary?: number;
  workPreference?: string;
  experienceMin?: number;
  experienceMax?: number;
  education?: string;
}

export interface SearchResult {
  hits: any[];
  estimatedTotalHits: number;
  query: string;
  processingTimeMs: number;
  limit: number;
  offset: number;
  facetDistribution?: Record<string, any>;
}

@Injectable()
export class ResumeSearchService {
  private readonly logger = new Logger(ResumeSearchService.name);
  private readonly indexName = 'resumes';

  constructor(
    private readonly meilisearchService: MeilisearchService,
    @InjectRepository(Resume)
    private readonly resumeRepository: Repository<Resume>,
  ) {}

  /**
   * 搜索简历
   */
  async searchResumes(
    params: ResumeSearchParams,
    page: number = 1,
    limit: number = 20,
  ): Promise<SearchResult> {
    try {
      const offset = (page - 1) * limit;
      
      // 构建搜索条件
      const searchOptions: any = {
        limit,
        offset,
        attributesToRetrieve: ['*'],
        attributesToHighlight: ['title', 'summary', 'current_position', 'current_company'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
        showMatchesPosition: true,
        sort: ['match_score:desc', 'updated_at:desc'],
      };

      // 添加过滤器
      const filters = this.buildFilters(params);
      if (filters.length > 0) {
        searchOptions.filter = filters;
      }

      // 执行搜索
      const searchResult = await this.meilisearchService.search(
        this.indexName,
        params.query || '',
        searchOptions,
      );

      // 获取完整的简历数据
      const resumeIds = searchResult.hits.map((hit: any) => hit.id);
      const resumes = await this.getResumesByIds(resumeIds);

      // 将Meilisearch的命中信息附加到简历
      const enrichedResumes = resumes.map(resume => {
        const hit = searchResult.hits.find((h: any) => h.id === resume.id);
        if (hit) {
          return {
            ...resume,
            _highlight: hit._highlight,
            _formatted: hit._formatted,
            _rankingScore: hit._rankingScore,
          };
        }
        return resume;
      });

      return {
        hits: enrichedResumes,
        estimatedTotalHits: searchResult.estimatedTotalHits,
        query: params.query || '',
        processingTimeMs: searchResult.processingTimeMs,
        limit,
        offset,
        facetDistribution: searchResult.facetDistribution,
      };
    } catch (error) {
      this.logger.error(`简历搜索失败: ${error.message}`, error.stack);
      
      // 如果Meilisearch不可用，回退到数据库搜索
      return await this.fallbackSearch(params, page, limit);
    }
  }

  /**
   * 构建搜索过滤器
   */
  private buildFilters(params: ResumeSearchParams): string[] {
    const filters: string[] = [];

    // 基础状态过滤器
    filters.push('is_looking_for_job = true');
    filters.push('visibility = "public"');

    // 位置过滤器
    if (params.location) {
      filters.push(`location = "${params.location}"`);
    }

    // 职位过滤器
    if (params.position) {
      filters.push(`current_position = "${params.position}"`);
    }

    // 薪资过滤器
    if (params.minSalary !== undefined) {
      filters.push(`expected_salary >= ${params.minSalary}`);
    }
    if (params.maxSalary !== undefined) {
      filters.push(`expected_salary <= ${params.maxSalary}`);
    }

    // 工作偏好过滤器
    if (params.workPreference) {
      filters.push(`work_preference = "${params.workPreference}"`);
    }

    // 技能过滤器（IN查询）
    if (params.skills && params.skills.length > 0) {
      const skillFilters = params.skills.map(skill => `skills = "${skill}"`);
      filters.push(`(${skillFilters.join(' OR ')})`);
    }

    return filters;
  }

  /**
   * 通过ID获取简历
   */
  private async getResumesByIds(ids: string[]): Promise<Resume[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.resumeRepository.find({
      where: { id: ids as any },
      relations: [
        'user',
        'experiences',
        'educations',
        'skills',
        'projects',
      ],
    });
  }

  /**
   * Meilisearch不可用时的回退搜索
   */
  private async fallbackSearch(
    params: ResumeSearchParams,
    page: number,
    limit: number,
  ): Promise<SearchResult> {
    this.logger.warn('Meilisearch不可用，使用数据库回退搜索');

    const offset = (page - 1) * limit;
    const query = this.resumeRepository.createQueryBuilder('resume')
      .leftJoinAndSelect('resume.user', 'user')
      .leftJoinAndSelect('resume.experiences', 'experiences')
      .leftJoinAndSelect('resume.educations', 'educations')
      .leftJoinAndSelect('resume.skills', 'skills')
      .leftJoinAndSelect('resume.projects', 'projects')
      .where('resume.visibility = :visibility', { visibility: ResumeVisibility.PUBLIC })
      .andWhere('resume.status = :status', { status: ResumeStatus.ACTIVE })
      .andWhere('resume.is_looking_for_job = :looking', { looking: true })
      .orderBy('resume.match_score', 'DESC')
      .addOrderBy('resume.updated_at', 'DESC');

    // 文本搜索
    if (params.query) {
      query.andWhere(
        '(resume.title ILIKE :query OR resume.summary ILIKE :query OR resume.current_position ILIKE :query OR resume.current_company ILIKE :query)',
        { query: `%${params.query}%` }
      );
    }

    // 位置过滤
    if (params.location) {
      query.andWhere('resume.location ILIKE :location', { location: `%${params.location}%` });
    }

    // 职位过滤
    if (params.position) {
      query.andWhere('resume.current_position ILIKE :position', { position: `%${params.position}%` });
    }

    // 薪资过滤
    if (params.minSalary !== undefined) {
      query.andWhere('resume.expected_salary >= :minSalary', { minSalary: params.minSalary });
    }
    if (params.maxSalary !== undefined) {
      query.andWhere('resume.expected_salary <= :maxSalary', { maxSalary: params.maxSalary });
    }

    // 技能过滤
    if (params.skills && params.skills.length > 0) {
      query.andWhere(
        'EXISTS (SELECT 1 FROM resume_skill WHERE resume_skill.resume_id = resume.id AND resume_skill.name IN (:...skills))',
        { skills: params.skills }
      );
    }

    const [resumes, total] = await query
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      hits: resumes,
      estimatedTotalHits: total,
      query: params.query || '',
      processingTimeMs: 0,
      limit,
      offset,
    };
  }

  /**
   * 高级搜索：多条件组合
   */
  async advancedSearch(
    params: ResumeSearchParams,
    page: number = 1,
    limit: number = 20,
  ): Promise<SearchResult> {
    // 添加更多搜索逻辑
    return this.searchResumes(params, page, limit);
  }

  /**
   * 搜索自动补全
   */
  async searchAutocomplete(query: string, limit: number = 5): Promise<Array<{
    type: 'position' | 'skill' | 'location' | 'company';
    value: string;
    count: number;
  }>> {
    try {
      // 使用Meilisearch的搜索自动补全
      const results = await this.meilisearchService.search(
        this.indexName,
        query,
        {
          limit: 0,
          attributesToRetrieve: [],
          // attributesToSearchOn 不是 SearchOptions 的标准属性，已移除
          showMatchesPosition: false,
        }
      );

      // 这里应该解析facetDistribution来生成补全建议
      // 简化处理，返回一些示例数据
      return [
        { type: 'position', value: '前端工程师', count: 42 },
        { type: 'position', value: '全栈工程师', count: 28 },
        { type: 'skill', value: 'React', count: 67 },
        { type: 'skill', value: 'Node.js', count: 45 },
        { type: 'location', value: '北京', count: 89 },
      ];
    } catch (error) {
      this.logger.error(`搜索自动补全失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 获取搜索聚合统计
   */
  async getSearchStats(params: ResumeSearchParams): Promise<{
    total: number;
    byLocation: Record<string, number>;
    byPosition: Record<string, number>;
    bySalaryRange: Record<string, number>;
    byExperience: Record<string, number>;
  }> {
    try {
      const searchResult = await this.meilisearchService.search(
        this.indexName,
        params.query || '',
        {
          limit: 0,
          facets: ['location', 'current_position', 'expected_salary', 'total_experience'],
          filter: this.buildFilters(params),
        }
      );

      return {
        total: searchResult.estimatedTotalHits,
        byLocation: searchResult.facetDistribution?.location || {},
        byPosition: searchResult.facetDistribution?.current_position || {},
        bySalaryRange: this.aggregateSalaryRanges(searchResult.facetDistribution?.expected_salary),
        byExperience: this.aggregateExperienceRanges(searchResult.facetDistribution?.total_experience),
      };
    } catch (error) {
      this.logger.error(`获取搜索统计失败: ${error.message}`);
      return {
        total: 0,
        byLocation: {},
        byPosition: {},
        bySalaryRange: {},
        byExperience: {},
      };
    }
  }

  /**
   * 聚合薪资范围
   */
  private aggregateSalaryRanges(salaryFacets: Record<string, number> = {}): Record<string, number> {
    const ranges: Record<string, number> = {
      '0-10k': 0,
      '10k-20k': 0,
      '20k-30k': 0,
      '30k-50k': 0,
      '50k-100k': 0,
      '100k+': 0,
    };

    for (const [salary, count] of Object.entries(salaryFacets)) {
      const salaryNum = parseInt(salary);
      if (!isNaN(salaryNum)) {
        if (salaryNum < 10000) ranges['0-10k'] += count;
        else if (salaryNum < 20000) ranges['10k-20k'] += count;
        else if (salaryNum < 30000) ranges['20k-30k'] += count;
        else if (salaryNum < 50000) ranges['30k-50k'] += count;
        else if (salaryNum < 100000) ranges['50k-100k'] += count;
        else ranges['100k+'] += count;
      }
    }

    return ranges;
  }

  /**
   * 聚合经验范围
   */
  private aggregateExperienceRanges(experienceFacets: Record<string, number> = {}): Record<string, number> {
    const ranges: Record<string, number> = {
      '应届生': 0,
      '1-3年': 0,
      '3-5年': 0,
      '5-10年': 0,
      '10年以上': 0,
    };

    for (const [experience, count] of Object.entries(experienceFacets)) {
      const expNum = parseInt(experience);
      if (!isNaN(expNum)) {
        if (expNum === 0) ranges['应届生'] += count;
        else if (expNum <= 3) ranges['1-3年'] += count;
        else if (expNum <= 5) ranges['3-5年'] += count;
        else if (expNum <= 10) ranges['5-10年'] += count;
        else ranges['10年以上'] += count;
      }
    }

    return ranges;
  }

  /**
   * 获取热门搜索
   */
  async getPopularSearches(limit: number = 10): Promise<string[]> {
    // TODO: 实现热门搜索记录和统计
    // 现在返回一些示例数据
    return [
      '前端工程师',
      'Java开发',
      '产品经理',
      '数据分析',
      '机器学习',
      'UI设计师',
      '运营专员',
      '市场推广',
      '人力资源',
      '财务总监',
    ];
  }

  /**
   * 记录搜索历史
   */
  async recordSearchHistory(userId: string, query: string, params: ResumeSearchParams): Promise<void> {
    try {
      // TODO: 实现搜索历史记录到Redis或数据库
      this.logger.log(`用户 ${userId} 搜索: ${query}`, params);
    } catch (error) {
      this.logger.error(`记录搜索历史失败: ${error.message}`);
    }
  }
}
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';

export interface SearchIndexConfig {
  uid: string;
  primaryKey: string;
  searchableAttributes?: string[];
  filterableAttributes?: string[];
  sortableAttributes?: string[];
  displayedAttributes?: string[];
  rankingRules?: string[];
  stopWords?: string[];
  synonyms?: Record<string, string[]>;
}

export interface SearchResult<T = any> {
  hits: T[];
  estimatedTotalHits: number;
  query: string;
  limit: number;
  offset: number;
  processingTimeMs: number;
  facetDistribution?: Record<string, Record<string, number>>;
}

export interface SearchFilters {
  [key: string]: string | string[] | number | number[] | boolean | null | undefined;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  attributesToRetrieve?: string[];
  attributesToCrop?: string[];
  cropLength?: number;
  attributesToHighlight?: string[];
  filter?: string | string[];
  sort?: string[];
  facets?: string[];
  facetsDistribution?: Record<string, string[]>;
  highlightPreTag?: string;
  highlightPostTag?: string;
  showMatchesPosition?: boolean;
  matchingStrategy?: 'all' | 'last';
  page?: number;
  hitsPerPage?: number;
}

@Injectable()
export class MeilisearchService implements OnModuleInit, OnModuleDestroy {
  private client: MeiliSearch;
  private readonly logger = new Logger(MeilisearchService.name);
  private readonly defaultIndexConfigs: Record<string, SearchIndexConfig> = {
    resumes: {
      uid: 'resumes',
      primaryKey: 'id',
      searchableAttributes: [
        'name',
        'currentPosition',
        'skills',
        'summary',
        'education.school',
        'education.major',
        'experience.company',
        'experience.position',
        'experience.description',
      ],
      filterableAttributes: [
        'location',
        'experienceYears',
        'expectedSalary.min',
        'expectedSalary.max',
        'availability',
        'skills',
        'education.degree',
        'industry',
      ],
      sortableAttributes: [
        'experienceYears',
        'updatedAt',
        'createdAt',
        'expectedSalary.min',
      ],
      displayedAttributes: [
        'id',
        'name',
        'currentPosition',
        'experienceYears',
        'location',
        'skills',
        'summary',
        'education',
        'experience',
        'expectedSalary',
        'availability',
        'updatedAt',
        'userId',
        'isPublic',
      ],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ],
    },
    jobs: {
      uid: 'jobs',
      primaryKey: 'id',
      searchableAttributes: [
        'title',
        'companyName',
        'description',
        'requirements',
        'responsibilities',
        'skillsRequired',
        'department',
      ],
      filterableAttributes: [
        'location',
        'jobType',
        'salaryRange.min',
        'salaryRange.max',
        'experienceRequired.min',
        'experienceRequired.max',
        'educationRequired',
        'skillsRequired',
        'industry',
        'companyScale',
      ],
      sortableAttributes: [
        'salaryRange.min',
        'createdAt',
        'updatedAt',
        'experienceRequired.min',
      ],
      displayedAttributes: [
        'id',
        'title',
        'companyName',
        'location',
        'jobType',
        'salaryRange',
        'experienceRequired',
        'educationRequired',
        'skillsRequired',
        'description',
        'requirements',
        'responsibilities',
        'createdAt',
        'updatedAt',
        'recruiterId',
        'isActive',
      ],
    },
    users: {
      uid: 'users',
      primaryKey: 'id',
      searchableAttributes: [
        'username',
        'email',
        'bio',
        'location',
        'skills',
        'interests',
      ],
      filterableAttributes: [
        'role',
        'location',
        'industry',
        'skills',
        'experienceYears',
      ],
      sortableAttributes: [
        'createdAt',
        'lastLoginAt',
      ],
      displayedAttributes: [
        'id',
        'username',
        'email',
        'avatar',
        'role',
        'location',
        'bio',
        'skills',
        'interests',
        'experienceYears',
        'createdAt',
        'lastLoginAt',
        'isActive',
      ],
    },
    squareContents: {
      uid: 'square_contents',
      primaryKey: 'id',
      searchableAttributes: [
        'title',
        'description',
        'tags',
        'author.username',
        'metadata.location',
        'metadata.skills',
      ],
      filterableAttributes: [
        'type',
        'subtype',
        'visibility',
        'tags',
        'metadata.location',
        'metadata.experience.min',
        'metadata.experience.max',
        'metadata.salary.min',
        'metadata.salary.max',
        'authorRole',
      ],
      sortableAttributes: [
        'createdAt',
        'updatedAt',
        'viewCount',
        'likeCount',
        'bookmarkCount',
      ],
      displayedAttributes: [
        'id',
        'type',
        'subtype',
        'title',
        'description',
        'coverImage',
        'tags',
        'viewCount',
        'likeCount',
        'commentCount',
        'shareCount',
        'bookmarkCount',
        'author',
        'authorRole',
        'createdAt',
        'updatedAt',
        'expiresAt',
        'visibility',
        'metadata',
        'resumeId',
        'jobId',
      ],
    },
  };

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get('MEILISEARCH_HOST', 'http://localhost:7700');
    const apiKey = this.configService.get('MEILISEARCH_API_KEY', 'masterKey');

    this.client = new MeiliSearch({
      host,
      apiKey,
    });

    try {
      // 测试连接
      const health = await this.client.health();
      this.logger.log(`Meilisearch连接成功: ${health.status}`);
      
      // 初始化索引配置
      await this.initializeIndexes();
    } catch (error) {
      this.logger.error('Meilisearch连接失败:', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Meilisearch服务关闭');
  }

  /**
   * 初始化所有索引配置
   */
  private async initializeIndexes(): Promise<void> {
    for (const [indexName, config] of Object.entries(this.defaultIndexConfigs)) {
      try {
        await this.ensureIndex(config);
        this.logger.log(`索引 ${indexName} 初始化成功`);
      } catch (error) {
        this.logger.error(`索引 ${indexName} 初始化失败:`, error.message);
      }
    }
  }

  /**
   * 确保索引存在并配置正确
   */
  async ensureIndex(config: SearchIndexConfig): Promise<void> {
    const index = this.client.index(config.uid);

    try {
      // 检查索引是否存在
      await index.getStats();
      
      // 索引已存在，更新配置
      await this.updateIndexSettings(index, config);
    } catch (error) {
      if (error.code === 'index_not_found') {
        // 索引不存在，创建新索引
        await this.client.createIndex(config.uid, config);
        this.logger.log(`创建索引: ${config.uid}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * 更新索引设置
   */
  private async updateIndexSettings(index: any, config: SearchIndexConfig): Promise<void> {
    const tasks = [];

    if (config.searchableAttributes) {
      tasks.push(index.updateSearchableAttributes(config.searchableAttributes));
    }

    if (config.filterableAttributes) {
      tasks.push(index.updateFilterableAttributes(config.filterableAttributes));
    }

    if (config.sortableAttributes) {
      tasks.push(index.updateSortableAttributes(config.sortableAttributes));
    }

    if (config.displayedAttributes) {
      tasks.push(index.updateDisplayedAttributes(config.displayedAttributes));
    }

    if (config.rankingRules) {
      tasks.push(index.updateRankingRules(config.rankingRules));
    }

    if (config.stopWords) {
      tasks.push(index.updateStopWords(config.stopWords));
    }

    if (config.synonyms) {
      tasks.push(index.updateSynonyms(config.synonyms));
    }

    await Promise.all(tasks);
  }

  /**
   * 添加或更新文档
   */
  async addOrUpdateDocuments<T extends Record<string, any>>(
    indexUid: string,
    documents: T | T[],
  ): Promise<void> {
    const index = this.client.index(indexUid);
    const docArray = Array.isArray(documents) ? documents : [documents];
    
    try {
      await index.addDocuments(docArray);
      this.logger.log(`成功添加/更新 ${docArray.length} 个文档到索引 ${indexUid}`);
    } catch (error) {
      this.logger.error(`添加文档到索引 ${indexUid} 失败:`, error.message);
      throw error;
    }
  }

  /**
   * 搜索文档
   */
  async search<T = any>(
    indexUid: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult<T>> {
    const index = this.client.index(indexUid);
    
    const searchOptions: SearchOptions = {
      limit: 20,
      ...options,
    };

    try {
      const result = await index.search(query, searchOptions);
      return {
        hits: result.hits as T[],
        estimatedTotalHits: result.estimatedTotalHits,
        query: result.query,
        limit: result.limit,
        offset: result.offset,
        processingTimeMs: result.processingTimeMs,
        facetDistribution: result.facetDistribution,
      };
    } catch (error) {
      this.logger.error(`搜索索引 ${indexUid} 失败:`, error.message);
      throw error;
    }
  }

  /**
   * 按条件过滤搜索
   */
  async searchWithFilters<T = any>(
    indexUid: string,
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {},
  ): Promise<SearchResult<T>> {
    // 构建过滤器字符串
    const filterStrings: string[] = [];

    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        if (value.length > 0) {
          const quotedValues = value.map(v => `"${v}"`).join(', ');
          filterStrings.push(`${key} IN [${quotedValues}]`);
        }
      } else if (typeof value === 'boolean') {
        filterStrings.push(`${key} = ${value}`);
      } else if (typeof value === 'number') {
        filterStrings.push(`${key} = ${value}`);
      } else if (typeof value === 'string') {
        filterStrings.push(`${key} = "${value}"`);
      }
    }

    const filterString = filterStrings.length > 0 ? filterStrings.join(' AND ') : undefined;

    return this.search<T>(indexUid, query, {
      ...options,
      filter: filterString,
    });
  }

  /**
   * 删除文档
   */
  async deleteDocuments(indexUid: string, documentIds: string | string[]): Promise<void> {
    const index = this.client.index(indexUid);
    const ids = Array.isArray(documentIds) ? documentIds : [documentIds];
    
    try {
      await index.deleteDocuments(ids);
      this.logger.log(`成功从索引 ${indexUid} 删除 ${ids.length} 个文档`);
    } catch (error) {
      this.logger.error(`从索引 ${indexUid} 删除文档失败:`, error.message);
      throw error;
    }
  }

  /**
   * 删除索引
   */
  async deleteIndex(indexUid: string): Promise<void> {
    try {
      await this.client.deleteIndex(indexUid);
      this.logger.log(`成功删除索引: ${indexUid}`);
    } catch (error) {
      this.logger.error(`删除索引 ${indexUid} 失败:`, error.message);
      throw error;
    }
  }

  /**
   * 获取索引统计信息
   */
  async getIndexStats(indexUid: string): Promise<any> {
    const index = this.client.index(indexUid);
    
    try {
      return await index.getStats();
    } catch (error) {
      this.logger.error(`获取索引 ${indexUid} 统计信息失败:`, error.message);
      throw error;
    }
  }

  /**
   * 批量操作 - 添加简历到搜索索引
   */
  async indexResumes(resumes: any[]): Promise<void> {
    if (resumes.length === 0) return;

    const documents = resumes.map(resume => ({
      id: resume.id,
      name: resume.name,
      currentPosition: resume.currentPosition,
      experienceYears: resume.experienceYears,
      location: resume.location,
      skills: resume.skills?.map((s: any) => s.name) || [],
      summary: resume.summary,
      education: resume.educations?.map((edu: any) => ({
        school: edu.school,
        major: edu.major,
        degree: edu.degree,
        startDate: edu.startDate,
        endDate: edu.endDate,
      })) || [],
      experience: resume.experiences?.map((exp: any) => ({
        company: exp.company,
        position: exp.position,
        description: exp.description,
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrent: exp.isCurrent,
      })) || [],
      expectedSalary: resume.expectedSalary,
      availability: resume.availability,
      industry: resume.industry,
      isPublic: resume.isPublic,
      userId: resume.userId,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    }));

    await this.addOrUpdateDocuments('resumes', documents);
  }

  /**
   * 批量操作 - 添加职位到搜索索引
   */
  async indexJobs(jobs: any[]): Promise<void> {
    if (jobs.length === 0) return;

    const documents = jobs.map(job => ({
      id: job.id,
      title: job.title,
      companyName: job.companyName,
      location: job.location,
      jobType: job.jobType,
      salaryRange: job.salaryRange,
      experienceRequired: job.experienceRequired,
      educationRequired: job.educationRequired,
      skillsRequired: job.skillsRequired || [],
      description: job.description,
      requirements: job.requirements,
      responsibilities: job.responsibilities,
      industry: job.industry,
      companyScale: job.companyScale,
      isActive: job.isActive,
      recruiterId: job.recruiterId,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }));

    await this.addOrUpdateDocuments('jobs', documents);
  }

  /**
   * 获取搜索建议（自动补全）
   */
  async getSuggestions(indexUid: string, query: string, limit = 5): Promise<string[]> {
    const index = this.client.index(indexUid);
    
    try {
      const result = await index.search(query, {
        limit: limit,
        attributesToRetrieve: ['name', 'title'], // 根据索引类型调整
      });
      
      // 提取建议文本
      return result.hits.map(hit => {
        if ('name' in hit) return hit.name;
        if ('title' in hit) return hit.title;
        return '';
      }).filter(Boolean);
    } catch (error) {
      this.logger.error(`获取搜索建议失败:`, error.message);
      return [];
    }
  }

  /**
   * 获取搜索性能统计
   */
  async getSearchStats(): Promise<{
    totalSearches: number;
    avgResponseTime: number;
    topQueries: Array<{ query: string; count: number }>;
  }> {
    // TODO: 实现搜索统计功能
    // 需要Meilisearch Pro版本或自定义统计跟踪
    return {
      totalSearches: 0,
      avgResponseTime: 0,
      topQueries: [],
    };
  }

  /**
   * 重置索引（清空并重新配置）
   */
  async resetIndex(indexUid: string, config?: SearchIndexConfig): Promise<void> {
    try {
      // 删除现有索引
      await this.deleteIndex(indexUid);
      
      // 等待删除完成
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 重新创建索引
      const indexConfig = config || this.defaultIndexConfigs[indexUid];
      if (!indexConfig) {
        throw new Error(`未找到索引 ${indexUid} 的配置`);
      }
      
      await this.ensureIndex(indexConfig);
      this.logger.log(`成功重置索引: ${indexUid}`);
    } catch (error) {
      this.logger.error(`重置索引 ${indexUid} 失败:`, error.message);
      throw error;
    }
  }

  /**
   * 获取所有索引信息
   */
  async getAllIndexes(): Promise<any[]> {
    try {
      const indexes = await this.client.getIndexes();
      return indexes.results || [];
    } catch (error) {
      this.logger.error(`获取所有索引失败:`, error.message);
      throw error;
    }
  }

  /**
   * 检查服务健康状态
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    version?: string;
    indexes: string[];
    error?: string;
  }> {
    try {
      const health = await this.client.health();
      const indexes = await this.getAllIndexes();
      
      return {
        status: health.status === 'available' ? 'healthy' : 'unhealthy',
        version: 'unknown', // MeiliSearch健康检查不返回版本号
        indexes: indexes.map((index: any) => index.uid),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        indexes: [],
        error: error.message,
      };
    }
  }
}
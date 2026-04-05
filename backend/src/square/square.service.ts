import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, In, Like, Not } from 'typeorm';
import { SquareContent, ContentType, ContentSubtype, VisibilityLevel } from './entities/square-content.entity';
import { SquareInteraction, InteractionType } from './entities/square-interaction.entity';
import { User } from '../users/entities/user.entity';
import { Resume } from '../resumes/entities/resume.entity';
import { Job } from '../recruiters/entities/job.entity';
import { CreateSquareContentDto } from './dto/create-square-content.dto';
import { UpdateSquareContentDto } from './dto/update-square-content.dto';
import { SquareContentResponseDto } from './dto/square-content-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { RedisService } from '../common/redis/redis.service';

export interface SquareFilterOptions {
  type?: ContentType;
  subtype?: ContentSubtype;
  tags?: string[];
  location?: string;
  minSalary?: number;
  maxSalary?: number;
  minExperience?: number;
  maxExperience?: number;
  skills?: string[];
  availability?: string;
  jobType?: string;
  authorRole?: string;
  visibility?: VisibilityLevel;
  userId?: string; // 当前用户ID（用于权限检查）
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'popularity' | 'relevance';
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class SquareService {
  constructor(
    @InjectRepository(SquareContent)
    private squareContentRepository: Repository<SquareContent>,
    @InjectRepository(SquareInteraction)
    private interactionRepository: Repository<SquareInteraction>,
    @InjectRepository(Resume)
    private resumeRepository: Repository<Resume>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    private redisService: RedisService,
  ) {}

  /**
   * 创建广场内容
   */
  async createContent(createDto: CreateSquareContentDto, user: User): Promise<SquareContent> {
    // 验证关联实体
    if (createDto.resumeId) {
      const resume = await this.resumeRepository.findOne({
        where: { id: createDto.resumeId, user: { id: user.id } },
      });
      if (!resume) {
        throw new BadRequestException('简历不存在或无权访问');
      }
    }

    if (createDto.jobId) {
      const job = await this.jobRepository.findOne({
        where: { id: createDto.jobId, recruiter_id: user.id },
      });
      if (!job) {
        throw new BadRequestException('职位不存在或无权访问');
      }
    }

    const content = this.squareContentRepository.create({
      ...createDto,
      authorId: user.id,
      authorRole: user.role,
    });

    const savedContent = await this.squareContentRepository.save(content);
    
    // 缓存热门内容
    await this.cacheTrendingContent();
    
    return savedContent;
  }

  /**
   * 获取广场内容列表
   */
  async findAll(
    filter: SquareFilterOptions = {},
    pagination: PaginationOptions = { page: 1, limit: 20 },
  ): Promise<{ items: SquareContentResponseDto[]; total: number; page: number; limit: number }> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: FindOptionsWhere<SquareContent> = {};

    // 应用过滤器
    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.subtype) {
      where.subtype = filter.subtype;
    }

    // 权限过滤：仅显示用户有权访问的内容
    if (filter.userId) {
      where.visibility = VisibilityLevel.PUBLIC;
      // TODO: 添加connections级别的权限检查
    }

    // 位置过滤
    if (filter.location) {
      where.metadata = Like(`%${filter.location}%`);
    }

    // 构建查询
    const query = this.squareContentRepository.createQueryBuilder('content')
      .leftJoinAndSelect('content.author', 'author')
      .leftJoinAndSelect('content.resume', 'resume')
      .leftJoinAndSelect('content.job', 'job')
      .where(where)
      .skip(skip)
      .take(limit);

    // 排序
    if (sortBy === 'popularity') {
      // 综合评分排序：浏览量*1 + 点赞数*2 + 收藏数*3
      query.addSelect('(content.viewCount * 1 + content.likeCount * 2 + content.bookmarkCount * 3)', 'popularity_score')
        .orderBy('popularity_score', sortOrder);
    } else if (sortBy === 'relevance') {
      // TODO: 实现基于用户兴趣的相关性排序
      query.orderBy('content.createdAt', sortOrder);
    } else {
      query.orderBy(`content.${sortBy}`, sortOrder);
    }

    const [items, total] = await query.getManyAndCount();

    // 转换响应格式
    const responseItems = await Promise.all(
      items.map(item => this.toResponseDto(item, filter.userId))
    );

    return {
      items: responseItems,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取单个广场内容
   */
  async findOne(id: string, userId?: string): Promise<SquareContentResponseDto> {
    const content = await this.squareContentRepository.findOne({
      where: { id },
      relations: ['author', 'resume', 'job'],
    });

    if (!content) {
      throw new NotFoundException('内容不存在');
    }

    // 权限检查
    if (content.visibility === VisibilityLevel.PRIVATE && content.authorId !== userId) {
      throw new ForbiddenException('无权访问此内容');
    }

    // 记录浏览量
    if (userId && userId !== content.authorId) {
      await this.recordInteraction(id, userId, InteractionType.VIEW, {
        duration: 0,
        scrollDepth: 0,
        deviceType: 'web',
      });
    }

    return this.toResponseDto(content, userId);
  }

  /**
   * 更新广场内容
   */
  async update(id: string, updateDto: UpdateSquareContentDto, userId: string): Promise<SquareContent> {
    const content = await this.squareContentRepository.findOne({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException('内容不存在');
    }

    if (content.authorId !== userId) {
      throw new ForbiddenException('无权修改此内容');
    }

    Object.assign(content, updateDto);
    return await this.squareContentRepository.save(content);
  }

  /**
   * 删除广场内容
   */
  async remove(id: string, userId: string): Promise<void> {
    const content = await this.squareContentRepository.findOne({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException('内容不存在');
    }

    if (content.authorId !== userId) {
      throw new ForbiddenException('无权删除此内容');
    }

    await this.squareContentRepository.softDelete(id);
  }

  /**
   * 记录用户互动
   */
  async recordInteraction(
    contentId: string,
    userId: string,
    type: InteractionType,
    extraData?: any,
  ): Promise<SquareInteraction> {
    // 检查内容是否存在
    const content = await this.squareContentRepository.findOne({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('内容不存在');
    }

    // 检查是否已存在相同类型的互动
    const existingInteraction = await this.interactionRepository.findOne({
      where: {
        contentId,
        userId,
        type,
      },
    });

    if (existingInteraction) {
      // 对于点赞、收藏等，可以取消
      if (type === InteractionType.LIKE || type === InteractionType.BOOKMARK) {
        const removedInteraction = { ...existingInteraction, isActive: false };
        await this.interactionRepository.remove(existingInteraction);
        // 减少计数
        await this.updateInteractionCount(contentId, type, -1);
        return removedInteraction;
      }
      return existingInteraction;
    }

    // 创建新的互动记录
    const interaction = this.interactionRepository.create({
      contentId,
      userId,
      type,
      ...this.getInteractionExtraData(type, extraData),
    });

    const savedInteraction = await this.interactionRepository.save(interaction);
    
    // 增加计数
    await this.updateInteractionCount(contentId, type, 1);

    // TypeORM save方法可能返回数组，需要处理
    return Array.isArray(savedInteraction) ? savedInteraction[0] : savedInteraction;
  }

  /**
   * 获取用户与内容的互动状态
   */
  async getUserInteraction(contentId: string, userId: string): Promise<{
    liked: boolean;
    bookmarked: boolean;
    shared: boolean;
  }> {
    const interactions = await this.interactionRepository.find({
      where: {
        contentId,
        userId,
        type: In([InteractionType.LIKE, InteractionType.BOOKMARK, InteractionType.SHARE]),
      },
    });

    const result = {
      liked: false,
      bookmarked: false,
      shared: false,
    };

    interactions.forEach(interaction => {
      if (interaction.type === InteractionType.LIKE) result.liked = true;
      if (interaction.type === InteractionType.BOOKMARK) result.bookmarked = true;
      if (interaction.type === InteractionType.SHARE) result.shared = true;
    });

    return result;
  }

  /**
   * 获取热门内容（缓存）
   */
  async getTrendingContent(limit: number = 10): Promise<SquareContentResponseDto[]> {
    const cacheKey = `square:trending:${limit}`;
    const cached = await this.redisService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // 查询热门内容：过去7天内，按综合评分排序
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const contents = await this.squareContentRepository.createQueryBuilder('content')
      .leftJoinAndSelect('content.author', 'author')
      .where('content.createdAt > :oneWeekAgo', { oneWeekAgo })
      .addSelect('(content.viewCount * 1 + content.likeCount * 2 + content.bookmarkCount * 3)', 'score')
      .orderBy('score', 'DESC')
      .limit(limit)
      .getMany();

    const responseItems = await Promise.all(
      contents.map(content => this.toResponseDto(content))
    );

    // 缓存5分钟
    await this.redisService.set(cacheKey, JSON.stringify(responseItems), 300);
    
    return responseItems;
  }

  /**
   * 搜索广场内容
   */
  async search(query: string, options: { type?: ContentType; limit?: number } = {}): Promise<SquareContentResponseDto[]> {
    const { type, limit = 20 } = options;

    const qb = this.squareContentRepository.createQueryBuilder('content')
      .leftJoinAndSelect('content.author', 'author')
      .where('content.visibility = :visibility', { visibility: VisibilityLevel.PUBLIC })
      .andWhere('(content.title ILIKE :query OR content.description ILIKE :query OR content.tags::text ILIKE :query)', {
        query: `%${query}%`,
      });

    if (type) {
      qb.andWhere('content.type = :type', { type });
    }

    if (limit) {
      qb.limit(limit);
    }

    const contents = await qb.getMany();
    return Promise.all(contents.map(content => this.toResponseDto(content)));
  }

  /**
   * 私有方法：转换响应DTO
   */
  private async toResponseDto(content: SquareContent, userId?: string): Promise<SquareContentResponseDto> {
    const authorDto: UserResponseDto = {
      id: content.author.id,
      email: content.author.email,
      nickname: content.author.username,
      avatar: content.author.avatar_url,
      role: content.author.role,
      createdAt: content.author.created_at,
    };

    const response: SquareContentResponseDto = {
      id: content.id,
      type: content.type,
      subtype: content.subtype,
      resumeId: content.resumeId,
      jobId: content.jobId,
      title: content.title,
      description: content.description,
      coverImage: content.coverImage,
      tags: content.tags,
      viewCount: content.viewCount,
      likeCount: content.likeCount,
      commentCount: content.commentCount,
      shareCount: content.shareCount,
      bookmarkCount: content.bookmarkCount,
      author: authorDto,
      authorRole: content.authorRole,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      expiresAt: content.expiresAt,
      visibility: content.visibility,
      metadata: content.metadata,
    };

    // 添加用户交互状态
    if (userId) {
      response.userInteraction = await this.getUserInteraction(content.id, userId);
    }

    // 添加预览信息
    if (content.resume) {
      response.resumePreview = {
        id: content.resume.id,
        name: content.resume.title || content.author.username || '未命名简历',
        currentPosition: content.resume.current_position || '',
        experienceYears: content.metadata?.experienceYears || 0,
      };
    }

    if (content.job) {
      response.jobPreview = {
        id: content.job.id,
        title: content.job.title,
        company: content.job.company_name || '',
        jobType: content.job.type,
      };
    }

    // 计算流行度评分
    response.popularityScore = content.viewCount * 1 + content.likeCount * 2 + content.bookmarkCount * 3;

    return response;
  }

  /**
   * 私有方法：更新互动计数
   */
  private async updateInteractionCount(contentId: string, type: InteractionType, delta: number): Promise<void> {
    const updateFields: Record<string, string> = {
      [InteractionType.LIKE]: 'likeCount',
      [InteractionType.BOOKMARK]: 'bookmarkCount',
      [InteractionType.SHARE]: 'shareCount',
      [InteractionType.VIEW]: 'viewCount',
    };

    const field = updateFields[type];
    if (!field) return;

    await this.squareContentRepository.createQueryBuilder()
      .update(SquareContent)
      .set({ [field]: () => `${field} + ${delta}` })
      .where('id = :id', { id: contentId })
      .execute();
  }

  /**
   * 私有方法：获取互动额外数据
   */
  private getInteractionExtraData(type: InteractionType, extraData: any): any {
    switch (type) {
      case InteractionType.COMMENT:
        return { comment: extraData?.comment };
      case InteractionType.SHARE:
        return { shareInfo: extraData };
      case InteractionType.VIEW:
        return { viewInfo: extraData };
      default:
        return {};
    }
  }

  /**
   * 私有方法：缓存热门内容
   */
  private async cacheTrendingContent(): Promise<void> {
    // 定期更新缓存
    await this.getTrendingContent(10);
  }

  // ==================== 前端联调方法 ====================

  /**
   * 人才广场 - 获取人才列表
   * 查询公开简历并关联用户信息
   */
  async getTalents(options: {
    page: number;
    limit: number;
    keyword?: string;
    location?: string;
    experience?: string;
    education?: string;
    salary_min?: number;
    salary_max?: number;
    skills?: string[];
    sort?: string;
  }) {
    const qb = this.resumeRepository
      .createQueryBuilder('resume')
      .leftJoinAndSelect('resume.user', 'user')
      .where('resume.visibility = :visibility', { visibility: 'public' })
      .andWhere('user.status = :status', { status: 'active' });

    if (options.keyword) {
      qb.andWhere(
        '(user.username ILIKE :kw OR user.bio ILIKE :kw OR user.position ILIKE :kw OR resume.title ILIKE :kw)',
        { kw: `%${options.keyword}%` },
      );
    }

    if (options.location) {
      qb.andWhere('(user.location ILIKE :loc OR resume.preferred_location ILIKE :loc)', {
        loc: `%${options.location}%`,
      });
    }

    if (options.skills && options.skills.length) {
      const skillConditions = options.skills.map(
        (_, i) => `EXISTS (SELECT 1 FROM resume_skills rs JOIN resume r2 ON r2.id = rs."resumeId" JOIN skills s ON s.id = rs."skillId" WHERE r2.id = resume.id AND s.name ILIKE :skill${i})`,
      );
      const params: Record<string, string> = {};
      options.skills.forEach((s, i) => {
        params[`skill${i}`] = `%${s}%`;
      });
      qb.andWhere(`(${skillConditions.join(' OR ')})`, params);
    }

    if (options.experience) {
      const expMap: Record<string, [number, number]> = {
        fresh: [0, 1],
        junior: [1, 3],
        mid: [3, 5],
        senior: [5, 10],
        expert: [10, 999],
      };
      const range = expMap[options.experience];
      if (range) {
        qb.andWhere('user.experience_years >= :expMin AND user.experience_years < :expMax', {
          expMin: range[0],
          expMax: range[1],
        });
      }
    }

    // 排序
    switch (options.sort) {
      case 'recent':
        qb.orderBy('resume.created_at', 'DESC');
        break;
      case 'experience':
        qb.orderBy('user.experience_years', 'DESC');
        break;
      default:
        qb.orderBy('resume.created_at', 'DESC');
    }

    const [resumes, total] = await qb
      .skip((options.page - 1) * options.limit)
      .take(options.limit)
      .getManyAndCount();

    const items = resumes.map((resume) => ({
      id: resume.id,
      title: resume.title,
      user: {
        id: resume.user?.id,
        username: resume.user?.username,
        avatar_url: resume.user?.avatar_url,
        bio: resume.user?.bio,
        location: resume.user?.location,
        position: resume.user?.position,
        company: resume.user?.company,
        experience_years: resume.user?.experience_years,
        role: resume.user?.role,
        is_verified: resume.user?.is_verified,
      },
      skills: [],  // 需要关联查询 skills 实体，暂时返回空数组
      expected_salary: resume.expected_salary,
      status: resume.status,
      created_at: resume.created_at,
    }));

    return {
      items,
      total,
      page: options.page,
      limit: options.limit,
      has_more: options.page * options.limit < total,
    };
  }

  /**
   * 人才广场 - 获取职位列表
   * 查询开放状态的职位
   */
  async getSquareJobs(options: {
    page: number;
    limit: number;
    keyword?: string;
    location?: string;
    type?: string;
    salary_min?: number;
    salary_max?: number;
  }) {
    const qb = this.jobRepository
      .createQueryBuilder('job')
      .where('job.status = :status', { status: 'open' });

    if (options.keyword) {
      qb.andWhere(
        '(job.title ILIKE :kw OR job.description ILIKE :kw OR job.company_name ILIKE :kw)',
        { kw: `%${options.keyword}%` },
      );
    }

    if (options.location) {
      qb.andWhere('job.location ILIKE :loc', { loc: `%${options.location}%` });
    }

    if (options.type) {
      qb.andWhere('job.job_type = :type', { type: options.type });
    }

    if (options.salary_min) {
      qb.andWhere('job.salary_min >= :salaryMin', { salaryMin: options.salary_min });
    }

    if (options.salary_max) {
      qb.andWhere('job.salary_max <= :salaryMax', { salaryMax: options.salary_max });
    }

    qb.orderBy('job.created_at', 'DESC');

    const [jobs, total] = await qb
      .skip((options.page - 1) * options.limit)
      .take(options.limit)
      .getManyAndCount();

    const items = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      company_name: job.company_name,
      company_logo: job.company_logo,
      location: job.location,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency,
      job_type: job.type,
      experience_min: job.experience_min,
      education_level: job.education_level,
      required_skills: job.required_skills,
      status: job.status,
      description: job.description,
      created_at: job.created_at,
    }));

    return {
      items,
      total,
      page: options.page,
      limit: options.limit,
      has_more: options.page * options.limit < total,
    };
  }
}
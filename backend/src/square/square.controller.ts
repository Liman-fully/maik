import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { In } from 'typeorm';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { User } from '../users/entities/user.entity';
import { ContentSubtype } from './entities/square-content.entity';
import { SquareService, SquareFilterOptions, PaginationOptions } from './square.service';
import { CreateSquareContentDto } from './dto/create-square-content.dto';
import { UpdateSquareContentDto } from './dto/update-square-content.dto';
import { SquareContentResponseDto } from './dto/square-content-response.dto';
import { ContentType } from './entities/square-content.entity';
import { InteractionType } from './entities/square-interaction.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('square')
@Controller('square')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SquareController {
  constructor(private readonly squareService: SquareService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建广场内容' })
  @ApiResponse({ status: 201, description: '内容创建成功', type: SquareContentResponseDto })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(
    @Body() createSquareContentDto: CreateSquareContentDto,
    @Request() req: ExpressRequest & { user: User },
  ): Promise<SquareContentResponseDto> {
    const content = await this.squareService.createContent(createSquareContentDto, req.user);
    return this.squareService.findOne(content.id, req.user.id);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取广场内容列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 20 })
  @ApiQuery({ name: 'type', required: false, description: '内容类型', enum: ContentType })
  @ApiQuery({ name: 'subtype', required: false, description: '内容子类型' })
  @ApiQuery({ name: 'tags', required: false, description: '标签', type: [String] })
  @ApiQuery({ name: 'location', required: false, description: '地点' })
  @ApiQuery({ name: 'minSalary', required: false, description: '最低薪资' })
  @ApiQuery({ name: 'maxSalary', required: false, description: '最高薪资' })
  @ApiQuery({ name: 'skills', required: false, description: '技能', type: [String] })
  @ApiQuery({ name: 'sortBy', required: false, description: '排序字段', enum: ['createdAt', 'popularity'] })
  @ApiQuery({ name: 'sortOrder', required: false, description: '排序方向', enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query() query: {
      page?: string;
      limit?: string;
      type?: ContentType;
      subtype?: string;
      tags?: string;
      location?: string;
      minSalary?: string;
      maxSalary?: string;
      skills?: string;
      sortBy?: string;
      sortOrder?: string;
    },
    @Request() req: ExpressRequest & { user: User },
  ) {
    const filter: SquareFilterOptions = {};
    const pagination: PaginationOptions = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      sortBy: query.sortBy as any,
      sortOrder: query.sortOrder as any,
    };

    // 解析过滤器
    if (query.type) filter.type = query.type;
    if (query.subtype) filter.subtype = query.subtype as ContentSubtype;
    if (query.tags) filter.tags = query.tags.split(',');
    if (query.location) filter.location = query.location;
    if (query.minSalary) filter.minSalary = parseFloat(query.minSalary);
    if (query.maxSalary) filter.maxSalary = parseFloat(query.maxSalary);
    if (query.skills) filter.skills = query.skills.split(',');

    // 添加当前用户ID用于权限检查
    filter.userId = req.user.id;

    return await this.squareService.findAll(filter, pagination);
  }

  @Get('trending')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取热门内容' })
  @ApiQuery({ name: 'limit', required: false, description: '数量限制', example: 10 })
  @ApiResponse({ status: 200, description: '获取成功', type: [SquareContentResponseDto] })
  async getTrending(
    @Query('limit') limit?: string,
  ): Promise<SquareContentResponseDto[]> {
    return await this.squareService.getTrendingContent(parseInt(limit) || 10);
  }

  @Get('search')
  @ApiBearerAuth()
  @ApiOperation({ summary: '搜索广场内容' })
  @ApiQuery({ name: 'q', required: true, description: '搜索关键词' })
  @ApiQuery({ name: 'type', required: false, description: '内容类型', enum: ContentType })
  @ApiQuery({ name: 'limit', required: false, description: '数量限制', example: 20 })
  @ApiResponse({ status: 200, description: '搜索成功', type: [SquareContentResponseDto] })
  async search(
    @Query('q') query: string,
    @Query('type') type?: ContentType,
    @Query('limit') limit?: string,
  ): Promise<SquareContentResponseDto[]> {
    return await this.squareService.search(query, {
      type,
      limit: parseInt(limit) || 20,
    });
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取单个广场内容' })
  @ApiParam({ name: 'id', description: '内容ID' })
  @ApiResponse({ status: 200, description: '获取成功', type: SquareContentResponseDto })
  @ApiResponse({ status: 404, description: '内容不存在' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async findOne(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: User },
  ): Promise<SquareContentResponseDto> {
    return await this.squareService.findOne(id, req.user.id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新广场内容' })
  @ApiParam({ name: 'id', description: '内容ID' })
  @ApiBody({ type: UpdateSquareContentDto })
  @ApiResponse({ status: 200, description: '更新成功', type: SquareContentResponseDto })
  @ApiResponse({ status: 404, description: '内容不存在' })
  @ApiResponse({ status: 403, description: '无权修改' })
  async update(
    @Param('id') id: string,
    @Body() updateSquareContentDto: UpdateSquareContentDto,
    @Request() req: ExpressRequest & { user: User },
  ): Promise<SquareContentResponseDto> {
    await this.squareService.update(id, updateSquareContentDto, req.user.id);
    return await this.squareService.findOne(id, req.user.id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除广场内容' })
  @ApiParam({ name: 'id', description: '内容ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '内容不存在' })
  @ApiResponse({ status: 403, description: '无权删除' })
  async remove(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: User },
  ): Promise<void> {
    await this.squareService.remove(id, req.user.id);
  }

  @Post(':id/interactions/:type')
  @ApiBearerAuth()
  @ApiOperation({ summary: '记录用户互动' })
  @ApiParam({ name: 'id', description: '内容ID' })
  @ApiParam({ name: 'type', description: '互动类型', enum: InteractionType })
  @ApiBody({ schema: { type: 'object', additionalProperties: true } })
  @ApiResponse({ status: 201, description: '互动记录成功' })
  @ApiResponse({ status: 404, description: '内容不存在' })
  async recordInteraction(
    @Param('id') contentId: string,
    @Param('type') type: InteractionType,
    @Body() data: any,
    @Request() req: ExpressRequest & { user: User },
  ) {
    const result = await this.squareService.recordInteraction(
      contentId,
      req.user.id,
      type,
      data,
    );

    return {
      success: true,
      data: result,
      message: type === InteractionType.LIKE || type === InteractionType.BOOKMARK
        ? (result ? '操作成功' : '操作已取消')
        : '操作成功',
    };
  }

  @Get(':id/interactions/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户互动状态' })
  @ApiParam({ name: 'id', description: '内容ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getInteractionStatus(
    @Param('id') contentId: string,
    @Request() req: ExpressRequest & { user: User },
  ) {
    return await this.squareService.getUserInteraction(contentId, req.user.id);
  }

  // ==================== 前端联调接口：人才广场 ====================

  @Get('talents')
  @ApiBearerAuth()
  @ApiOperation({ summary: '人才广场 - 获取人才列表' })
  async getTalents(
    @Query() query: {
      page?: string;
      limit?: string;
      keyword?: string;
      location?: string;
      experience?: string;
      education?: string;
      salary_min?: string;
      salary_max?: string;
      skills?: string;
      sort?: string;
    },
  ) {
    return this.squareService.getTalents({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      keyword: query.keyword,
      location: query.location,
      experience: query.experience,
      education: query.education,
      salary_min: query.salary_min ? parseFloat(query.salary_min) : undefined,
      salary_max: query.salary_max ? parseFloat(query.salary_max) : undefined,
      skills: query.skills ? query.skills.split(',') : undefined,
      sort: query.sort,
    });
  }

  @Get('square-jobs')
  @ApiBearerAuth()
  @ApiOperation({ summary: '人才广场 - 获取职位列表' })
  async getSquareJobs(
    @Query() query: {
      page?: string;
      limit?: string;
      keyword?: string;
      location?: string;
      type?: string;
      salary_min?: string;
      salary_max?: string;
    },
  ) {
    return this.squareService.getSquareJobs({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      keyword: query.keyword,
      location: query.location,
      type: query.type,
      salary_min: query.salary_min ? parseFloat(query.salary_min) : undefined,
      salary_max: query.salary_max ? parseFloat(query.salary_max) : undefined,
    });
  }

  @Get('user/contents')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户创建的广场内容' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 20 })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserContents(
    @Query() query: { page?: string; limit?: string },
    @Request() req: ExpressRequest & { user: User },
  ) {
    const pagination: PaginationOptions = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    };

    const filter: SquareFilterOptions = {
      userId: req.user.id,
    };

    return await this.squareService.findAll(filter, pagination);
  }

  @Get('user/bookmarks')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户收藏的广场内容' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 20 })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserBookmarks(
    @Query() query: { page?: string; limit?: string },
    @Request() req: ExpressRequest & { user: User },
  ) {
    const pagination: PaginationOptions = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    };

    // 获取用户收藏的内容ID
    const interactions = await this.squareService['interactionRepository'].find({
      where: {
        userId: req.user.id,
        type: InteractionType.BOOKMARK,
      },
      select: ['contentId'],
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    const contentIds = interactions.map(i => i.contentId);
    const total = await this.squareService['interactionRepository'].count({
      where: {
        userId: req.user.id,
        type: InteractionType.BOOKMARK,
      },
    });

    // 获取内容详情
    const contents = await this.squareService['squareContentRepository'].find({
      where: { id: In(contentIds) },
      relations: ['author'],
    });

    // 转换为响应格式
    const responseItems = await Promise.all(
      contents.map(content => this.squareService['toResponseDto'](content, req.user.id))
    );

    return {
      items: responseItems,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }
}
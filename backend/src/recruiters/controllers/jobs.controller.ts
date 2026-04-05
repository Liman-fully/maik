import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from '../services/jobs.service';
import { CreateJobDto } from '../dto/create-job.dto';
import { UpdateJobDto } from '../dto/update-job.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { JobSearchService } from '../services/job-search.service';
import { ResumeRecommendationService } from '../services/resume-recommendation.service';
import { JobStatus } from '../entities/job.entity';

@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobSearchService: JobSearchService,
    private readonly resumeRecommendationService: ResumeRecommendationService,
  ) {}

  @Post()
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '创建职位' })
  @ApiResponse({ status: 201, description: '职位创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(@Body() createJobDto: CreateJobDto, @Request() req) {
    const userId = req.user.id;
    return this.jobsService.create(createJobDto, userId);
  }

  @Get()
  @ApiOperation({ summary: '获取职位列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status: string,
    @Query('type') type: string,
    @Query('location') location: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    const filters: any = {};

    if (status) filters.status = status;
    if (type) filters.type = type;
    if (location) filters.location = location;

    return this.jobsService.findAll(
      userId,
      parseInt(page),
      parseInt(limit),
      filters,
    );
  }

  @Get('search')
  @ApiOperation({ summary: '搜索职位' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchJobs(
    @Query('q') query: string,
    @Query('location') location: string,
    @Query('type') type: string,
    @Query('industry') industry: string,
    @Query('minSalary') minSalary: string,
    @Query('maxSalary') maxSalary: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const searchParams = {
      query: query || '',
      location,
      type,
      industry,
      minSalary: minSalary ? parseFloat(minSalary) : undefined,
      maxSalary: maxSalary ? parseFloat(maxSalary) : undefined,
    };

    return this.jobSearchService.searchJobs(
      searchParams,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('recommended')
  @ApiOperation({ summary: '获取推荐职位' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRecommendedJobs(@Request() req) {
    const userId = req.user.id;
    return this.jobsService.getRecommendedJobs(userId);
  }

  @Get('public')
  @ApiOperation({ summary: '获取公开职位列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPublicJobs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.jobsService.findPublicJobs(
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('my')
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '获取我发布的职位列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyJobs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.jobsService.findByUser(
      userId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取职位详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '职位不存在' })
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.jobsService.findOne(id, userId);
  }

  @Get(':id/applicants')
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '获取职位申请人列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getJobApplicants(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.jobsService.getJobApplicants(id, userId, parseInt(page), parseInt(limit));
  }

  @Get(':id/recommended-resumes')
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '获取推荐简历列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRecommendedResumes(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.resumeRecommendationService.getRecommendedResumesForJob(id, userId);
  }

  @Patch(':id')
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '更新职位' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '职位不存在' })
  async update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.jobsService.update(id, updateJobDto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '删除职位' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '职位不存在' })
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.jobsService.remove(id, userId);
  }

  @Post(':id/publish')
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '发布职位' })
  @ApiResponse({ status: 200, description: '发布成功' })
  async publishJob(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.jobsService.updateStatus(id, JobStatus.OPEN, userId);
  }

  @Post(':id/close')
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '关闭职位' })
  @ApiResponse({ status: 200, description: '关闭成功' })
  async closeJob(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.jobsService.updateStatus(id, JobStatus.CLOSED, userId);
  }

  @Post(':id/fill')
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '标记职位已填满' })
  @ApiResponse({ status: 200, description: '标记成功' })
  async fillJob(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.jobsService.updateStatus(id, JobStatus.FILLED, userId);
  }

  @Get(':id/stats')
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '获取职位统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getJobStats(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.jobsService.getJobStats(id, userId);
  }

  @Post(':id/refresh')
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '刷新职位' })
  @ApiResponse({ status: 200, description: '刷新成功' })
  async refreshJob(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.jobsService.refreshJob(id, userId);
  }
}

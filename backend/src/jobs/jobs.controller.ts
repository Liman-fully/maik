import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';

@ApiTags('职位管理')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: '获取职位列表' })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('category') category?: string,
    @Query('location') location?: string,
    @Query('keyword') keyword?: string,
    @Query('salary_min') salaryMin?: string,
    @Query('salary_max') salaryMax?: string,
    @Query('status') status?: string,
  ) {
    return this.jobsService.findAll(
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
      { category, location, keyword, salaryMin, salaryMax, status },
    );
  }

  @Get('my')
  @ApiOperation({ summary: '获取我发布的职位' })
  async getMyJobs(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const userId = req.user.id;
    return this.jobsService.findByRecruiter(
      userId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取职位详情' })
  async findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '发布职位' })
  async create(
    @Req() req: Request & { user: User },
    @Body() body: {
      title: string;
      company: string;
      location: string;
      salary_min?: number;
      salary_max?: number;
      experience_required?: string;
      education_required?: string;
      description: string;
      requirements?: string[];
      benefits?: string[];
      skills?: string[];
      category?: string;
      type?: string;
    },
  ) {
    const userId = req.user.id;
    return this.jobsService.create(userId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新职位' })
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{
      title: string;
      location: string;
      salary_min: number;
      salary_max: number;
      description: string;
      requirements: string[];
      benefits: string[];
      skills: string[];
      status: string;
    }>,
  ) {
    return this.jobsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除职位' })
  async remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }

  @Post(':id/apply')
  @ApiOperation({ summary: '申请职位' })
  async apply(
    @Req() req: Request & { user: User },
    @Param('id') id: string,
    @Body() body: { resume_id: string; cover_letter?: string },
  ) {
    const userId = req.user.id;
    return this.jobsService.apply(id, userId, body.resume_id, body.cover_letter);
  }

  @Get(':id/applications')
  @ApiOperation({ summary: '获取职位申请人列表' })
  async getApplications(
    @Req() req: Request & { user: User },
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.jobsService.getApplications(
      id,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }

  @Post('applications/:id/status')
  @ApiOperation({ summary: '更新申请状态' })
  async updateApplicationStatus(
    @Param('id') id: string,
    @Body() body: { status: string; interview_info?: any },
  ) {
    return this.jobsService.updateApplicationStatus(id, body.status, body.interview_info);
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: '收藏职位' })
  async favorite(
    @Req() req: Request & { user: User },
    @Param('id') id: string,
  ) {
    const userId = req.user.id;
    return this.jobsService.favorite(userId, id);
  }

  @Delete(':id/favorite')
  @ApiOperation({ summary: '取消收藏' })
  async unfavorite(
    @Req() req: Request & { user: User },
    @Param('id') id: string,
  ) {
    const userId = req.user.id;
    return this.jobsService.unfavorite(userId, id);
  }

  @Get('favorites/list')
  @ApiOperation({ summary: '获取收藏的职位' })
  async getFavorites(
    @Req() req: Request & { user: User },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const userId = req.user.id;
    return this.jobsService.getFavorites(
      userId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }
}

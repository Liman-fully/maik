import { Controller, Get, Post, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BoleService } from './bole.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';

@ApiTags('伯乐管理')
@Controller('bole')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BoleController {
  constructor(private readonly boleService: BoleService) {}

  @Get('profile')
  @ApiOperation({ summary: '获取伯乐档案' })
  async getProfile(@Req() req: Request & { user: User }) {
    const userId = req.user.id;
    return this.boleService.getOrCreateProfile(userId);
  }

  @Post('apply')
  @ApiOperation({ summary: '申请成为伯乐' })
  async apply(
    @Req() req: Request & { user: User },
    @Body() body: { introduction: string; specialties: string[] },
  ) {
    const userId = req.user.id;
    return this.boleService.applyForBole(userId, body.introduction, body.specialties);
  }

  @Get('referrals')
  @ApiOperation({ summary: '获取推荐记录' })
  async getReferrals(
    @Req() req: Request & { user: User },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
  ) {
    const userId = req.user.id;
    return this.boleService.getReferrals(
      userId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
      status,
    );
  }

  @Post('refer')
  @ApiOperation({ summary: '推荐候选人' })
  async referCandidate(
    @Req() req: Request & { user: User },
    @Body() body: { resume_id: string; job_id?: string },
  ) {
    const userId = req.user.id;
    return this.boleService.referCandidate(userId, body.resume_id, body.job_id);
  }

  @Get('resumes')
  @ApiOperation({ summary: '获取伯乐简历库' })
  async getResumes(
    @Req() req: Request & { user: User },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const userId = req.user.id;
    return this.boleService.getBoleResumes(
      userId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }

  @Post('resumes/add')
  @ApiOperation({ summary: '添加简历到简历库' })
  async addResume(
    @Req() req: Request & { user: User },
    @Body() body: { resume_id: string },
  ) {
    const userId = req.user.id;
    return this.boleService.addResumeToPool(userId, body.resume_id);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取伯乐统计数据' })
  async getStats(@Req() req: Request & { user: User }) {
    const userId = req.user.id;
    return this.boleService.getBoleStats(userId);
  }

  @Post(':id/upgrade')
  @ApiOperation({ summary: '升级伯乐等级（管理员）' })
  async upgradeLevel(
    @Param('id') id: string,
    @Body() body: { level: string },
  ) {
    return this.boleService.upgradeLevel(id, body.level);
  }
}

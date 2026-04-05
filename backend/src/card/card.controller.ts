import { Controller, Get, Post, Body, Patch, Delete, Query, UseGuards, Req, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CardService } from './card.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';

@ApiTags('名片管理')
@Controller('card')
export class CardsController {
  constructor(private readonly cardService: CardService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的名片' })
  async getMyCard(@Req() req: Request & { user: User }) {
    const userId = req.user.id;
    return this.cardService.getOrCreateCard(userId);
  }

  @Get('public/:id')
  @ApiOperation({ summary: '获取公开名片' })
  async getPublicCard(@Param('id') id: string) {
    return this.cardService.getPublicCard(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建名片' })
  async create(
    @Req() req: Request & { user: User },
    @Body() body: {
      name: string;
      title: string;
      company: string;
      phone?: string;
      email?: string;
      wechat?: string;
      bio?: string;
      tags?: string[];
      template?: string;
      style?: any;
    },
  ) {
    const userId = req.user.id;
    return this.cardService.create(userId, body);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新名片' })
  async update(
    @Req() req: Request & { user: User },
    @Body() body: Partial<{
      name: string;
      title: string;
      company: string;
      phone: string;
      email: string;
      wechat: string;
      bio: string;
      tags: string[];
      template: string;
      style: any;
      is_public: boolean;
    }>,
  ) {
    const userId = req.user.id;
    return this.cardService.update(userId, body);
  }

  @Post('share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '分享名片（生成分享链接/二维码）' })
  async share(@Req() req: Request & { user: User }) {
    const userId = req.user.id;
    return this.cardService.generateShareLink(userId);
  }

  @Post('view/:id')
  @ApiOperation({ summary: '记录名片浏览' })
  async recordView(
    @Param('id') id: string,
    @Req() req: Request & { user?: User },
    @Body() body?: { source?: string },
  ) {
    const viewerId = req.user?.id;
    const ip = req.ip;
    return this.cardService.recordView(id, viewerId, ip, body?.source);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取名片统计' })
  async getStats(@Req() req: Request & { user: User }) {
    const userId = req.user.id;
    return this.cardService.getStats(userId);
  }

  @Get('views')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取名片浏览记录' })
  async getViews(
    @Req() req: Request & { user: User },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const userId = req.user.id;
    return this.cardService.getViews(
      userId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }
}

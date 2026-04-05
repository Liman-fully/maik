import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('收藏')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get('jobs')
  @ApiOperation({ summary: '获取收藏的职位列表' })
  async getFavoriteJobs(
    @Req() req: Request,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const userId = (req.user as any).id;
    return this.favoritesService.getFavoriteJobs(
      userId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 10,
    );
  }

  @Get('talents')
  @ApiOperation({ summary: '获取收藏的人才列表' })
  async getFavoriteTalents(
    @Req() req: Request,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const userId = (req.user as any).id;
    return this.favoritesService.getFavoriteTalents(
      userId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 10,
    );
  }

  @Post('jobs/:jobId')
  @ApiOperation({ summary: '收藏职位' })
  async addFavoriteJob(
    @Param('jobId') jobId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;
    return this.favoritesService.addFavoriteJob(userId, jobId);
  }

  @Delete('jobs/:jobId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '取消收藏职位' })
  async removeFavoriteJob(
    @Param('jobId') jobId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;
    return this.favoritesService.removeFavoriteJob(userId, jobId);
  }

  @Post('talents/:userId')
  @ApiOperation({ summary: '收藏人才' })
  async addFavoriteTalent(
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;
    return this.favoritesService.addFavoriteTalent(userId, targetUserId);
  }

  @Delete('talents/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '取消收藏人才' })
  async removeFavoriteTalent(
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;
    return this.favoritesService.removeFavoriteTalent(userId, targetUserId);
  }
}

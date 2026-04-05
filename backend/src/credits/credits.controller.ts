import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';

@ApiTags('积分管理')
@Controller('credits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('balance')
  @ApiOperation({ summary: '获取积分余额' })
  @ApiResponse({ status: 200, description: '返回积分余额' })
  async getBalance(@Req() req: Request & { user: User }) {
    const userId = req.user.id;
    return this.creditsService.getBalance(userId);
  }

  @Get('transactions')
  @ApiOperation({ summary: '获取积分交易记录' })
  @ApiResponse({ status: 200, description: '返回交易记录列表' })
  async getTransactions(
    @Req() req: Request & { user: User },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const userId = req.user.id;
    return this.creditsService.getTransactions(
      userId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }

  @Get('packages')
  @ApiOperation({ summary: '获取积分充值套餐' })
  @ApiResponse({ status: 200, description: '返回套餐列表' })
  async getPackages() {
    return this.creditsService.getPackages();
  }

  @Post('purchase')
  @ApiOperation({ summary: '购买积分套餐' })
  @ApiResponse({ status: 200, description: '创建订单' })
  async purchase(
    @Req() req: Request & { user: User },
    @Body() body: { package_id: string },
  ) {
    const userId = req.user.id;
    return this.creditsService.createPurchaseOrder(userId, body.package_id);
  }

  @Post('spend')
  @ApiOperation({ summary: '消费积分' })
  @ApiResponse({ status: 200, description: '消费成功' })
  async spend(
    @Req() req: Request & { user: User },
    @Body() body: { amount: number; category: string; description: string; related_id?: string },
  ) {
    const userId = req.user.id;
    return this.creditsService.spendCredits(
      userId,
      body.amount,
      body.category as any,
      body.description,
      body.related_id,
    );
  }
}

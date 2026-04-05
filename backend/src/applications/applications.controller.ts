import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('投递')
@Controller('applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get('my')
  @ApiOperation({ summary: '获取我的投递列表' })
  async getMyApplications(
    @Req() req: Request,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    const userId = (req.user as any).id;
    return this.applicationsService.getMyApplications(
      userId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 10,
      status,
    );
  }

  @Post(':applicationId/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '撤回投递' })
  async withdraw(
    @Param('applicationId') applicationId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;
    return this.applicationsService.withdraw(userId, applicationId);
  }
}

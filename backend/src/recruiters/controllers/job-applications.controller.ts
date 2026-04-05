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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JobApplicationsService } from '../services/job-applications.service';
import { CreateJobApplicationDto } from '../dto/create-job-application.dto';
import { UpdateJobApplicationDto } from '../dto/update-job-application.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('job-applications')
@ApiBearerAuth()
@Controller('job-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobApplicationsController {
  constructor(private readonly jobApplicationsService: JobApplicationsService) {}

  @Post()
  @ApiOperation({ summary: '申请职位' })
  @ApiResponse({ status: 201, description: '申请成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(
    @Body() createJobApplicationDto: CreateJobApplicationDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.jobApplicationsService.create(createJobApplicationDto, userId);
  }

  @Get()
  @ApiOperation({ summary: '获取我的职位申请列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findMyApplications(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    const filters: any = {};
    
    if (status) filters.status = status;

    return this.jobApplicationsService.findByUser(
      userId,
      parseInt(page),
      parseInt(limit),
      filters,
    );
  }

  @Get('recruiter')
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '获取我管理的职位申请列表（HR/Recruiter）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findRecruiterApplications(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status: string,
    @Query('jobId') jobId: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    const filters: any = {};
    
    if (status) filters.status = status;
    if (jobId) filters.jobId = jobId;

    return this.jobApplicationsService.findByRecruiter(
      userId,
      parseInt(page),
      parseInt(limit),
      filters,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取职位申请详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '申请不存在' })
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.jobApplicationsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新职位申请' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '申请不存在' })
  async update(
    @Param('id') id: string,
    @Body() updateJobApplicationDto: UpdateJobApplicationDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.jobApplicationsService.update(id, updateJobApplicationDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '撤回职位申请' })
  @ApiResponse({ status: 200, description: '撤回成功' })
  @ApiResponse({ status: 404, description: '申请不存在' })
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.jobApplicationsService.remove(id, userId);
  }

  @Post(':id/withdraw')
  @ApiOperation({ summary: '撤回职位申请' })
  @ApiResponse({ status: 200, description: '撤回成功' })
  async withdrawApplication(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.jobApplicationsService.withdraw(id, userId);
  }

  @Post(':id/accept')
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '接受职位申请' })
  @ApiResponse({ status: 200, description: '接受成功' })
  async acceptApplication(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.jobApplicationsService.accept(id, userId);
  }

  @Post(':id/reject')
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '拒绝职位申请' })
  @ApiResponse({ status: 200, description: '拒绝成功' })
  async rejectApplication(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.jobApplicationsService.reject(id, userId);
  }

  @Post(':id/interview')
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '安排面试' })
  @ApiResponse({ status: 200, description: '安排成功' })
  async scheduleInterview(
    @Param('id') id: string,
    @Body('interviewDate') interviewDate: string,
    @Body('interviewType') interviewType: string,
    @Body('interviewLink') interviewLink: string,
    @Body('notes') notes: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    
    if (!interviewDate) {
      throw new BadRequestException('请提供面试日期');
    }

    return this.jobApplicationsService.scheduleInterview(
      id,
      userId,
      new Date(interviewDate),
      interviewType || 'online',
      interviewLink,
      notes,
    );
  }

  @Post(':id/offer')
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '发送录用通知' })
  @ApiResponse({ status: 200, description: '发送成功' })
  async sendOffer(
    @Param('id') id: string,
    @Body('offerDetails') offerDetails: any,
    @Request() req,
  ) {
    const userId = req.user.id;
    
    if (!offerDetails) {
      throw new BadRequestException('请提供录用详情');
    }

    return this.jobApplicationsService.sendOffer(id, userId, offerDetails);
  }

  @Get('stats/my')
  @ApiOperation({ summary: '获取我的职位申请统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyApplicationStats(@Request() req) {
    const userId = req.user.id;
    return this.jobApplicationsService.getUserApplicationStats(userId);
  }

  @Get('stats/job/:jobId')
  @Roles(UserRole.HR, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: '获取职位申请统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getJobApplicationStats(@Param('jobId') jobId: string, @Request() req) {
    const userId = req.user.id;
    return this.jobApplicationsService.getJobApplicationStats(jobId, userId);
  }
}
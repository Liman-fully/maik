import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ResumesService } from './resumes.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Resume, ResumeVisibility } from './entities/resume.entity';
import { ResumeParserQueueService } from './services/resume-parser-queue.service';
import { ResumeSearchService } from './services/resume-search.service';

@ApiTags('resumes')
@ApiBearerAuth()
@Controller('resumes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResumesController {
  constructor(
    private readonly resumesService: ResumesService,
    private readonly resumeParserQueueService: ResumeParserQueueService,
    private readonly resumeSearchService: ResumeSearchService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建简历' })
  @ApiResponse({ status: 201, description: '简历创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(@Body() createResumeDto: CreateResumeDto, @Request() req) {
    const userId = req.user.id;
    return this.resumesService.create(createResumeDto, userId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        title: {
          type: 'string',
          description: '简历标题',
        },
        visibility: {
          type: 'string',
          enum: ['public', 'private', 'connections_only'],
          description: '可见性',
        },
      },
    },
  })
  @ApiOperation({ summary: '上传简历文件' })
  @ApiResponse({ status: 201, description: '简历上传成功' })
  async uploadResume(
    @UploadedFile() file: any,
    @Body('title') title: string,
    @Body('visibility') visibility: string,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    const userId = req.user.id;
    return this.resumesService.uploadAndParseResume(
      file,
      title || file.originalname,
      visibility || 'private',
      userId,
    );
  }

  @Post('upload/batch')
  @UseInterceptors(FileInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiOperation({ summary: '批量上传简历文件' })
  @ApiResponse({ status: 201, description: '批量上传成功' })
  async batchUploadResumes(
    @UploadedFile() files: any[],
    @Request() req,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('请上传文件');
    }

    if (files.length > 100) {
      throw new BadRequestException('单次最多上传100个文件');
    }

    const userId = req.user.id;
    const results = [];

    for (const file of files) {
      try {
        const resume = await this.resumesService.uploadAndParseResume(
          file,
          file.originalname,
          'private',
          userId,
        );
        results.push({ success: true, file: file.originalname, resumeId: resume.id });
      } catch (error) {
        results.push({ success: false, file: file.originalname, error: error.message });
      }
    }

    return {
      total: files.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  @Get()
  @ApiOperation({ summary: '获取简历列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status: string,
    @Query('visibility') visibility: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    const filters: any = {};

    if (status) filters.status = status;
    if (visibility) filters.visibility = visibility;

    return this.resumesService.findAll(
      userId,
      parseInt(page),
      parseInt(limit),
      filters,
    );
  }

  @Get('search')
  @ApiOperation({ summary: '搜索简历' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchResumes(
    @Query('q') query: string,
    @Query('location') location: string,
    @Query('position') position: string,
    @Query('minSalary') minSalary: string,
    @Query('maxSalary') maxSalary: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const searchParams = {
      query: query || '',
      location,
      position,
      minSalary: minSalary ? parseFloat(minSalary) : undefined,
      maxSalary: maxSalary ? parseFloat(maxSalary) : undefined,
    };

    return this.resumeSearchService.searchResumes(
      searchParams,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('recommended')
  @ApiOperation({ summary: '获取推荐简历' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRecommendedResumes(@Request() req) {
    const userId = req.user.id;
    return this.resumesService.getRecommendedResumes(userId);
  }

  @Get('public')
  @ApiOperation({ summary: '获取公开简历列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPublicResumes(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.resumesService.findPublicResumes(
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('my')
  @ApiOperation({ summary: '获取我的简历列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyResumes(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.resumesService.findByUser(
      userId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取简历详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '简历不存在' })
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.resumesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新简历' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '简历不存在' })
  async update(
    @Param('id') id: string,
    @Body() updateResumeDto: UpdateResumeDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.resumesService.update(id, updateResumeDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除简历' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '简历不存在' })
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.resumesService.remove(id, userId);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: '发布简历（设置为公开）' })
  @ApiResponse({ status: 200, description: '发布成功' })
  async publishResume(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.resumesService.updateVisibility(id, ResumeVisibility.PUBLIC, userId);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: '取消发布简历（设置为私有）' })
  @ApiResponse({ status: 200, description: '取消发布成功' })
  async unpublishResume(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.resumesService.updateVisibility(id, ResumeVisibility.PRIVATE, userId);
  }

  @Post(':id/refresh')
  @ApiOperation({ summary: '刷新简历（更新最后活跃时间）' })
  @ApiResponse({ status: 200, description: '刷新成功' })
  async refreshResume(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.resumesService.refreshResume(id, userId);
  }

  @Get(':id/status')
  @ApiOperation({ summary: '获取简历解析状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getParseStatus(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    const resume = await this.resumesService.findOne(id, userId);

    return {
      resumeId: resume.id,
      title: resume.title,
      parsingStatus: resume.parsing_status,
      parsedAt: resume.parsed_at,
      confidence: resume.parsing_confidence,
      isVerified: resume.is_verified,
      hasFile: !!resume.file_url,
    };
  }

  @Post(':id/retry-parse')
  @ApiOperation({ summary: '重试简历解析' })
  @ApiResponse({ status: 200, description: '重试任务已提交' })
  async retryParse(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    const resume = await this.resumesService.findOne(id, userId);

    if (!resume.file_url) {
      throw new BadRequestException('简历没有文件，无法重试解析');
    }

    // 添加解析任务到队列
    const jobId = await this.resumeParserQueueService.addResumeParseJob({
      resumeId: resume.id,
      userId,
      fileUrl: resume.file_url,
      fileName: resume.file_name || 'unknown',
      fileType: resume.file_type || 'application/pdf',
      fileSize: resume.file_size || 0,
      fileHash: resume.original_file_hash || '',
      priority: 'high',
    });

    return {
      success: true,
      jobId,
      message: '简历解析任务已提交，请稍后查看状态',
    };
  }

  @Get('parser/queue/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '获取简历解析队列状态（仅管理员）' })
  async getQueueStatus() {
    return this.resumeParserQueueService.getQueueStatus();
  }

  @Get('parser/queue/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '获取简历解析队列统计（仅管理员）' })
  async getQueueStatistics() {
    return this.resumeParserQueueService.getQueueStatistics();
  }

  @Post('parser/queue/retry-failed')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '重试所有失败任务（仅管理员）' })
  async retryFailedJobs(@Query('count') count: string = '10') {
    const retried = await this.resumeParserQueueService.retryFailedJobs(parseInt(count));
    return { retried, message: `已重试 ${retried} 个失败任务` };
  }

  @Post('parser/queue/clean')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '清理已完成任务（仅管理员）' })
  async cleanCompletedJobs(@Query('days') days: string = '7') {
    const cleaned = await this.resumeParserQueueService.cleanCompletedJobs(parseInt(days));
    return { cleaned, message: `已清理 ${cleaned} 个已完成任务` };
  }
}
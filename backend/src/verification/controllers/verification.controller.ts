import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Headers,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { EmailVerificationService } from '../services/email-verification.service';
import { RateLimiterService } from '../services/rate-limiter.service';
import { SendVerificationCodeDto, VerificationType } from '../dto/send-verification-code.dto';
import { VerifyCodeDto } from '../dto/verify-code.dto';
import { VerificationResponseDto } from '../dto/verification-response.dto';

@ApiTags('验证码')
@Controller('verification')
export class VerificationController {
  private readonly logger = new Logger(VerificationController.name);

  constructor(
    private readonly emailVerificationService: EmailVerificationService,
    private readonly rateLimiterService: RateLimiterService,
  ) {}

  /**
   * 发送验证码
   */
  @Post('code/send')
  @ApiOperation({ summary: '发送邮箱验证码' })
  @ApiResponse({ status: 200, description: '验证码发送成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 429, description: '请求过于频繁' })
  async sendVerificationCode(
    @Body(new ValidationPipe({ transform: true })) sendVerificationCodeDto: SendVerificationCodeDto,
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<VerificationResponseDto> {
    try {
      const ipAddress = forwardedFor?.split(',')[0]?.trim();

      const result = await this.emailVerificationService.sendVerificationCode(
        sendVerificationCodeDto.email,
        sendVerificationCodeDto.type,
        ipAddress,
        userAgent,
      );

      this.logger.log(
        `发送验证码成功: ${sendVerificationCodeDto.email}, 类型: ${sendVerificationCodeDto.type}`,
      );

      return VerificationResponseDto.success('验证码已发送', result);
    } catch (error) {
      this.logger.error(
        `发送验证码失败: ${error.message}`,
        error.stack,
      );

      if (error instanceof Error) {
        return VerificationResponseDto.error(
          error.message,
          'VERIFICATION_SEND_FAILED',
          { email: sendVerificationCodeDto.email, type: sendVerificationCodeDto.type },
        );
      }

      return VerificationResponseDto.error(
        '验证码发送失败',
        'INTERNAL_ERROR',
      );
    }
  }

  /**
   * 验证验证码
   */
  @Post('code/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证邮箱验证码' })
  @ApiResponse({ status: 200, description: '验证成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '验证码错误或过期' })
  async verifyCode(
    @Body(new ValidationPipe({ transform: true })) verifyCodeDto: VerifyCodeDto,
  ): Promise<VerificationResponseDto> {
    try {
      const result = await this.emailVerificationService.verifyCode(
        verifyCodeDto.email,
        verifyCodeDto.code,
        verifyCodeDto.type,
        verifyCodeDto.operationId,
      );

      if (result.verified) {
        this.logger.log(
          `验证码验证成功: ${verifyCodeDto.email}, 类型: ${verifyCodeDto.type}`,
        );

        return VerificationResponseDto.success('验证成功', {
          verified: true,
          token: result.token,
        });
      } else {
        return VerificationResponseDto.error(
          '验证失败',
          'VERIFICATION_FAILED',
        );
      }
    } catch (error) {
      this.logger.error(
        `验证码验证失败: ${error.message}`,
        error.stack,
      );

      if (error instanceof Error) {
        return VerificationResponseDto.error(
          error.message,
          'VERIFICATION_FAILED',
          { email: verifyCodeDto.email, type: verifyCodeDto.type },
        );
      }

      return VerificationResponseDto.error(
        '验证失败',
        'INTERNAL_ERROR',
      );
    }
  }

  /**
   * 检查验证码状态
   */
  @Get('code/status')
  @ApiOperation({ summary: '检查验证码状态' })
  @ApiQuery({ name: 'email', required: true, description: '邮箱地址' })
  @ApiQuery({ name: 'type', required: true, enum: VerificationType, description: '验证类型' })
  @ApiQuery({ name: 'operationId', required: false, description: '操作ID' })
  @ApiResponse({ status: 200, description: '获取状态成功' })
  async checkVerificationStatus(
    @Query('email') email: string,
    @Query('type') type: VerificationType,
    @Query('operationId') operationId?: string,
  ): Promise<VerificationResponseDto> {
    try {
      const status = await this.emailVerificationService.checkVerificationStatus(
        email,
        type,
        operationId,
      );

      return VerificationResponseDto.success('获取状态成功', status);
    } catch (error) {
      this.logger.error(`检查状态失败: ${error.message}`, error.stack);

      return VerificationResponseDto.error(
        error instanceof Error ? error.message : '检查状态失败',
        'STATUS_CHECK_FAILED',
      );
    }
  }

  /**
   * 验证令牌
   */
  @Post('token/verify')
  @ApiOperation({ summary: '验证验证令牌' })
  @ApiResponse({ status: 200, description: '令牌验证成功' })
  @ApiResponse({ status: 401, description: '令牌无效或过期' })
  async verifyToken(
    @Body('token') token: string,
  ): Promise<VerificationResponseDto> {
    try {
      const result = await this.emailVerificationService.verifyToken(token);

      return VerificationResponseDto.success('令牌验证成功', result);
    } catch (error) {
      this.logger.error(`令牌验证失败: ${error.message}`, error.stack);

      return VerificationResponseDto.error(
        error instanceof Error ? error.message : '令牌验证失败',
        'TOKEN_VERIFICATION_FAILED',
      );
    }
  }

  /**
   * 健康检查
   */
  @Get('health')
  @ApiOperation({ summary: '验证码服务健康检查' })
  @ApiResponse({ status: 200, description: '服务正常' })
  async healthCheck(): Promise<VerificationResponseDto> {
    try {
      // 临时注释掉redis连接检查，待RateLimiterService实现该方法
      // const redisStatus = await this.rateLimiterService.checkRedisConnection();
      
      return VerificationResponseDto.success('服务正常', {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        redis: 'connection_check_disabled', // 临时禁用redis连接检查
        version: '1.0.0',
      });
    } catch (error) {
      this.logger.error(`健康检查失败: ${error.message}`, error.stack);

      return VerificationResponseDto.error(
        '服务异常',
        'SERVICE_UNHEALTHY',
        {
          error: error instanceof Error ? error.message : '未知错误',
          timestamp: new Date().toISOString(),
        },
      );
    }
  }
}
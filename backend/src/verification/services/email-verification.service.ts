import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { VerificationType } from '../dto/send-verification-code.dto';
import { MailerService } from './mailer.service';
import { EmailTemplateData } from './mailer-config.interface';
import { RateLimiterService, RateLimitResult } from './rate-limiter.service';
import { VerificationCode } from '../entities/verification-code.entity';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  private readonly codeExpiresIn: number;
  private readonly codeLength: number;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
    private readonly mailerService: MailerService,
    private readonly rateLimiterService: RateLimiterService,
    private readonly configService: ConfigService,
  ) {
    this.codeExpiresIn = this.configService.get<number>(
      'VERIFICATION_CODE_EXPIRES',
      300,
    ); // 默认5分钟
    this.codeLength = this.configService.get<number>(
      'VERIFICATION_CODE_LENGTH',
      6,
    );
  }

  /**
   * 生成安全的随机验证码
   */
  private generateSecureCode(length: number = 6): string {
    // 使用 crypto 生成安全的随机数
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    const range = max - min + 1;
    
    // 确保范围是2的倍数，避免偏差
    const maxBytes = 6; // 48 bits
    let randomBytes: Buffer;
    let randomNumber: number;
    
    do {
      randomBytes = crypto.randomBytes(maxBytes);
      randomNumber = randomBytes.readUIntBE(0, maxBytes);
      randomNumber = randomNumber & 0x7FFFFFFF; // 确保是正数
    } while (randomNumber >= range * Math.floor(0xFFFFFFFFFFFF / range));
    
    const code = (randomNumber % range) + min;
    return code.toString();
  }

  /**
   * 生成操作ID
   */
  private generateOperationId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * 发送验证码到邮箱
   */
  async sendVerificationCode(
    email: string,
    type: VerificationType,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    operationId: string;
    retryAfter: number;
    expiresIn: number;
  }> {
    try {
      // 验证邮箱格式
      if (!this.isValidEmail(email)) {
        throw new BadRequestException('邮箱格式不正确');
      }

      // 检查频率限制
      const rateLimitResult = await this.rateLimiterService.checkSendVerification(
        email,
        type,
        ipAddress,
      );

      if (!rateLimitResult.allowed) {
        throw new BadRequestException(
          rateLimitResult.reason || '请求过于频繁',
          rateLimitResult.retryAfter
            ? `请在 ${rateLimitResult.retryAfter} 秒后重试`
            : undefined,
        );
      }

      // 生成验证码和操作ID
      const code = this.generateSecureCode(this.codeLength);
      const operationId = this.generateOperationId();
      const expiresAt = new Date(Date.now() + this.codeExpiresIn * 1000);

      // 存储验证码到Redis
      const redisKey = `verification:code:${email}:${type}:${operationId}`;
      const codeData = {
        code,
        attempts: 0,
        sentAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      };

      await this.redisClient.setex(
        redisKey,
        this.codeExpiresIn,
        JSON.stringify(codeData),
      );

      // 可选：保存到数据库用于审计
      await this.saveVerificationCodeToDatabase(
        email,
        code,
        type,
        ipAddress,
        userAgent,
        expiresAt,
        operationId,
      );

      // 准备邮件模板数据
      const templateData: EmailTemplateData = {
        code,
        type,
        expiresInMinutes: Math.floor(this.codeExpiresIn / 60),
        email,
        timestamp: new Date().toLocaleString('zh-CN'),
      };

      // 发送邮件
      try {
        await this.mailerService.sendVerificationCode(email, templateData);
      } catch (mailError) {
        this.logger.error(`发送验证码邮件失败: ${mailError.message}`, mailError.stack);
        // 如果邮件发送失败，清除Redis中的验证码记录
        await this.redisClient.del(redisKey);
        throw new InternalServerErrorException('验证码发送失败，请稍后重试');
      }

      // 记录发送行为（用于频率限制）
      await this.rateLimiterService.recordVerificationSent(email, type, ipAddress);

      this.logger.log(`验证码发送成功: ${email}, 类型: ${type}, 操作ID: ${operationId}`);

      return {
        operationId,
        retryAfter: this.rateLimiterService.getConfig().retryInterval,
        expiresIn: this.codeExpiresIn,
      };
    } catch (error) {
      this.logger.error(`发送验证码失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 验证验证码
   */
  async verifyCode(
    email: string,
    code: string,
    type: VerificationType,
    operationId?: string,
  ): Promise<{
    verified: boolean;
    token?: string;
  }> {
    try {
      // 验证邮箱格式
      if (!this.isValidEmail(email)) {
        throw new BadRequestException('邮箱格式不正确');
      }

      // 清理格式化的验证码（移除空格等）
      const cleanedCode = code.replace(/\s/g, '');

      if (cleanedCode.length !== this.codeLength) {
        throw new BadRequestException(`验证码必须是${this.codeLength}位数字`);
      }

      // 查找验证码记录
      let redisKey: string;
      if (operationId) {
        redisKey = `verification:code:${email}:${type}:${operationId}`;
      } else {
        // 如果没有operationId，尝试查找最近的有效验证码
        const pattern = `verification:code:${email}:${type}:*`;
        const keys = await this.redisClient.keys(pattern);
        
        if (keys.length === 0) {
          throw new UnauthorizedException('验证码不存在或已过期');
        }
        
        // 使用第一个有效的验证码
        redisKey = keys[0];
      }

      const codeDataStr = await this.redisClient.get(redisKey);
      
      if (!codeDataStr) {
        throw new UnauthorizedException('验证码不存在或已过期');
      }

      const codeData = JSON.parse(codeDataStr);

      // 检查验证尝试次数限制
      const verifyLimitResult = await this.rateLimiterService.checkVerifyAttempts(
        email,
        cleanedCode,
        type,
      );

      if (!verifyLimitResult.allowed) {
        throw new UnauthorizedException(
          verifyLimitResult.reason || '验证尝试次数过多',
        );
      }

      // 验证码是否过期
      const expiresAt = new Date(codeData.expiresAt);
      if (expiresAt < new Date()) {
        // 验证码已过期，删除记录
        await this.redisClient.del(redisKey);
        throw new UnauthorizedException('验证码已过期');
      }

      // 验证码是否匹配
      if (codeData.code !== cleanedCode) {
        // 记录验证失败
        await this.rateLimiterService.recordVerifyAttempt(
          email,
          cleanedCode,
          type,
          false,
        );
        
        // 更新尝试次数
        codeData.attempts += 1;
        await this.redisClient.setex(
          redisKey,
          Math.ceil((expiresAt.getTime() - Date.now()) / 1000),
          JSON.stringify(codeData),
        );

        const remainingAttempts = this.rateLimiterService.getConfig().maxVerifyAttempts - codeData.attempts;
        
        if (remainingAttempts <= 0) {
          await this.redisClient.del(redisKey);
          throw new UnauthorizedException('验证码错误次数过多，请重新获取验证码');
        } else {
          throw new UnauthorizedException(`验证码错误，还剩 ${remainingAttempts} 次尝试机会`);
        }
      }

      // 验证成功
      await this.rateLimiterService.recordVerifyAttempt(
        email,
        cleanedCode,
        type,
        true,
      );

      // 删除验证码记录（防止重复使用）
      await this.redisClient.del(redisKey);

      // 更新数据库记录（如果存在）
      await this.markVerificationCodeAsVerified(email, codeData, type, operationId);

      // 生成验证令牌（可选）
      const token = await this.generateVerificationToken(email, type);

      this.logger.log(`验证码验证成功: ${email}, 类型: ${type}`);

      return {
        verified: true,
        token,
      };
    } catch (error) {
      this.logger.error(`验证码验证失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 检查验证码状态
   */
  async checkVerificationStatus(
    email: string,
    type: VerificationType,
    operationId?: string,
  ): Promise<{
    exists: boolean;
    expiresAt?: Date;
    attempts?: number;
  }> {
    try {
      let redisKey: string;
      
      if (operationId) {
        redisKey = `verification:code:${email}:${type}:${operationId}`;
      } else {
        const pattern = `verification:code:${email}:${type}:*`;
        const keys = await this.redisClient.keys(pattern);
        
        if (keys.length === 0) {
          return { exists: false };
        }
        
        redisKey = keys[0];
      }

      const codeDataStr = await this.redisClient.get(redisKey);
      
      if (!codeDataStr) {
        return { exists: false };
      }

      const codeData = JSON.parse(codeDataStr);
      
      return {
        exists: true,
        expiresAt: new Date(codeData.expiresAt),
        attempts: codeData.attempts,
      };
    } catch (error) {
      this.logger.error(`检查验证码状态失败: ${error.message}`);
      return { exists: false };
    }
  }

  /**
   * 验证邮箱格式
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 保存验证码到数据库（用于审计）
   */
  private async saveVerificationCodeToDatabase(
    email: string,
    code: string,
    type: VerificationType,
    ipAddress?: string,
    userAgent?: string,
    expiresAt?: Date,
    operationId?: string,
  ): Promise<void> {
    try {
      const verificationCode = this.verificationCodeRepository.create({
        email,
        code,
        type,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt || new Date(Date.now() + this.codeExpiresIn * 1000),
        operation_id: operationId,
        is_used: false,
        attempts: 0,
      });

      await this.verificationCodeRepository.save(verificationCode);
    } catch (error) {
      this.logger.warn(`保存验证码到数据库失败: ${error.message}`);
      // 数据库保存失败不影响主要功能，继续执行
    }
  }

  /**
   * 标记验证码为已验证
   */
  private async markVerificationCodeAsVerified(
    email: string,
    codeData: any,
    type: VerificationType,
    operationId?: string,
  ): Promise<void> {
    try {
      const whereClause: any = {
        email,
        code: codeData.code,
        type,
        is_used: false,
      };

      if (operationId) {
        whereClause.operation_id = operationId;
      }

      await this.verificationCodeRepository.update(
        whereClause,
        {
          is_used: true,
          verified_at: new Date(),
          attempts: codeData.attempts,
        },
      );
    } catch (error) {
      this.logger.warn(`更新验证码状态失败: ${error.message}`);
    }
  }

  /**
   * 生成验证令牌（可选，可用于后续操作）
   */
  private async generateVerificationToken(
    email: string,
    type: VerificationType,
  ): Promise<string> {
    // 生成简单的JWT-like令牌
    const payload = {
      email,
      type,
      verified: true,
      timestamp: Date.now(),
    };

    const payloadStr = JSON.stringify(payload);
    const token = Buffer.from(payloadStr).toString('base64');
    
    // 可选：将令牌存储到Redis，设置较短的过期时间
    const tokenKey = `verification:token:${token}`;
    await this.redisClient.setex(tokenKey, 300, payloadStr); // 5分钟过期
    
    return token;
  }

  /**
   * 验证令牌
   */
  async verifyToken(token: string): Promise<{
    valid: boolean;
    email?: string;
    type?: VerificationType;
  }> {
    try {
      const tokenKey = `verification:token:${token}`;
      const tokenDataStr = await this.redisClient.get(tokenKey);
      
      if (!tokenDataStr) {
        return { valid: false };
      }

      const tokenData = JSON.parse(tokenDataStr);
      
      // 检查令牌是否过期（Redis TTL已处理，但这里可以额外检查时间戳）
      const tokenTimestamp = tokenData.timestamp;
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5分钟
      
      if (now - tokenTimestamp > maxAge) {
        await this.redisClient.del(tokenKey);
        return { valid: false };
      }

      return {
        valid: true,
        email: tokenData.email,
        type: tokenData.type,
      };
    } catch (error) {
      this.logger.error(`验证令牌失败: ${error.message}`);
      return { valid: false };
    }
  }

  /**
   * 清理过期的验证码记录
   */
  async cleanupExpiredCodes(): Promise<{
    redisCleaned: number;
    dbCleaned: number;
  }> {
    try {
      let redisCleaned = 0;
      let dbCleaned = 0;

      // 清理Redis中的过期验证码（Redis会自动清理，但这里可以手动清理）
      const pattern = 'verification:code:*';
      const keys = await this.redisClient.keys(pattern);
      
      for (const key of keys) {
        const ttl = await this.redisClient.ttl(key);
        if (ttl < 0) {
          await this.redisClient.del(key);
          redisCleaned++;
        }
      }

      // 清理数据库中的过期记录
      const expiredDate = new Date();
      const deleteResult = await this.verificationCodeRepository
        .createQueryBuilder()
        .delete()
        .where('expires_at < :expiredDate', { expiredDate })
        .execute();

      dbCleaned = deleteResult.affected || 0;

      this.logger.log(`清理完成: Redis ${redisCleaned} 条，数据库 ${dbCleaned} 条`);

      return {
        redisCleaned,
        dbCleaned,
      };
    } catch (error) {
      this.logger.error(`清理过期验证码失败: ${error.message}`);
      return {
        redisCleaned: 0,
        dbCleaned: 0,
      };
    }
  }
}
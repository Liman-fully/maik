import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export interface RateLimitConfig {
  maxAttemptsPerHour: number;
  maxAttemptsPerDay: number;
  retryInterval: number;
  maxVerifyAttempts: number;
  maxIpAttemptsPerHour: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  retryAfter?: number;
  reason?: string;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private config: RateLimitConfig;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly configService: ConfigService,
  ) {
    this.config = {
      maxAttemptsPerHour: this.configService.get<number>('VERIFICATION_MAX_ATTEMPTS_HOUR', 5),
      maxAttemptsPerDay: this.configService.get<number>('VERIFICATION_MAX_ATTEMPTS_DAY', 20),
      retryInterval: this.configService.get<number>('VERIFICATION_RETRY_INTERVAL', 60),
      maxVerifyAttempts: this.configService.get<number>('VERIFICATION_MAX_VERIFY_ATTEMPTS', 3),
      maxIpAttemptsPerHour: this.configService.get<number>('VERIFICATION_MAX_IP_ATTEMPTS_HOUR', 20),
    };
  }

  /**
   * 检查是否允许发送验证码
   */
  async checkSendVerification(
    email: string,
    type: string,
    ipAddress?: string,
  ): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    const hourWindow = Math.floor(now / 3600);
    const dayWindow = Math.floor(now / 86400);

    // 检查重试间隔
    const retryKey = `verification:retry:${email}:${type}`;
    const lastSent = await this.redisClient.get(retryKey);
    
    if (lastSent) {
      const lastSentTime = parseInt(lastSent);
      const elapsed = now - lastSentTime;
      
      if (elapsed < this.config.retryInterval) {
        return {
          allowed: false,
          retryAfter: this.config.retryInterval - elapsed,
          reason: '发送过于频繁，请稍后重试',
        };
      }
    }

    // 检查邮箱每小时限制
    const emailHourKey = `verification:rate:email:${email}:${type}:hour:${hourWindow}`;
    const emailHourCount = await this.redisClient.get(emailHourKey);
    const emailHourCountNum = emailHourCount ? parseInt(emailHourCount) : 0;
    
    if (emailHourCountNum >= this.config.maxAttemptsPerHour) {
      const ttl = await this.redisClient.ttl(emailHourKey);
      return {
        allowed: false,
        remaining: 0,
        retryAfter: ttl > 0 ? ttl : 3600,
        reason: '该邮箱请求过于频繁',
      };
    }

    // 检查邮箱每天限制
    const emailDayKey = `verification:rate:email:${email}:${type}:day:${dayWindow}`;
    const emailDayCount = await this.redisClient.get(emailDayKey);
    const emailDayCountNum = emailDayCount ? parseInt(emailDayCount) : 0;
    
    if (emailDayCountNum >= this.config.maxAttemptsPerDay) {
      const ttl = await this.redisClient.ttl(emailDayKey);
      return {
        allowed: false,
        remaining: 0,
        retryAfter: ttl > 0 ? ttl : 86400,
        reason: '该邮箱今日请求次数已达上限',
      };
    }

    // 检查IP限制（如果有IP地址）
    if (ipAddress) {
      const ipHourKey = `verification:rate:ip:${ipAddress}:hour:${hourWindow}`;
      const ipHourCount = await this.redisClient.get(ipHourKey);
      const ipHourCountNum = ipHourCount ? parseInt(ipHourCount) : 0;
      
      if (ipHourCountNum >= this.config.maxIpAttemptsPerHour) {
        const ttl = await this.redisClient.ttl(ipHourKey);
        return {
          allowed: false,
          remaining: 0,
          retryAfter: ttl > 0 ? ttl : 3600,
          reason: '该IP请求过于频繁',
        };
      }
    }

    return {
      allowed: true,
      remaining: this.config.maxAttemptsPerHour - emailHourCountNum - 1,
    };
  }

  /**
   * 记录验证码发送
   */
  async recordVerificationSent(
    email: string,
    type: string,
    ipAddress?: string,
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const hourWindow = Math.floor(now / 3600);
    const dayWindow = Math.floor(now / 86400);

    // 设置重试间隔
    const retryKey = `verification:retry:${email}:${type}`;
    await this.redisClient.setex(retryKey, this.config.retryInterval, now.toString());

    // 更新邮箱小时计数
    const emailHourKey = `verification:rate:email:${email}:${type}:hour:${hourWindow}`;
    await this.redisClient
      .multi()
      .incr(emailHourKey)
      .expire(emailHourKey, 3600) // 1小时过期
      .exec();

    // 更新邮箱天计数
    const emailDayKey = `verification:rate:email:${email}:${type}:day:${dayWindow}`;
    await this.redisClient
      .multi()
      .incr(emailDayKey)
      .expire(emailDayKey, 86400) // 24小时过期
      .exec();

    // 更新IP计数（如果有IP地址）
    if (ipAddress) {
      const ipHourKey = `verification:rate:ip:${ipAddress}:hour:${hourWindow}`;
      await this.redisClient
        .multi()
        .incr(ipHourKey)
        .expire(ipHourKey, 3600) // 1小时过期
        .exec();
    }

    this.logger.debug(`记录验证码发送: ${email}, 类型: ${type}, IP: ${ipAddress || '未知'}`);
  }

  /**
   * 检查验证码尝试次数
   */
  async checkVerifyAttempts(email: string, code: string, type: string): Promise<RateLimitResult> {
    const attemptsKey = `verification:attempts:${email}:${code}:${type}`;
    const attempts = await this.redisClient.get(attemptsKey);
    const attemptsNum = attempts ? parseInt(attempts) : 0;

    if (attemptsNum >= this.config.maxVerifyAttempts) {
      const ttl = await this.redisClient.ttl(attemptsKey);
      return {
        allowed: false,
        remaining: 0,
        retryAfter: ttl > 0 ? ttl : 300, // 5分钟锁定
        reason: '验证失败次数过多，请稍后重试',
      };
    }

    return {
      allowed: true,
      remaining: this.config.maxVerifyAttempts - attemptsNum - 1,
    };
  }

  /**
   * 记录验证码尝试
   */
  async recordVerifyAttempt(email: string, code: string, type: string, success: boolean): Promise<void> {
    const attemptsKey = `verification:attempts:${email}:${code}:${type}`;
    
    if (success) {
      // 验证成功，清除尝试记录
      await this.redisClient.del(attemptsKey);
    } else {
      // 验证失败，增加尝试计数
      const attempts = await this.redisClient.incr(attemptsKey);
      
      // 如果是第一次失败，设置过期时间
      if (attempts === 1) {
        await this.redisClient.expire(attemptsKey, 300); // 5分钟过期
      }
    }
  }

  /**
   * 清除所有限制记录（主要用于测试）
   */
  async clearAllLimits(email?: string, ipAddress?: string): Promise<void> {
    const keys = [];
    
    if (email) {
      const pattern = `verification:*${email}*`;
      const emailKeys = await this.redisClient.keys(pattern);
      keys.push(...emailKeys);
    }
    
    if (ipAddress) {
      const pattern = `verification:*${ipAddress}*`;
      const ipKeys = await this.redisClient.keys(pattern);
      keys.push(...ipKeys);
    }
    
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
      this.logger.log(`清除了 ${keys.length} 个限制记录`);
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): RateLimitConfig {
    return { ...this.config };
  }
}
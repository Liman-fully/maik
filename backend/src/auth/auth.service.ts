import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { UserStatus } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
  ) {}

  async register(registerData: {
    email: string;
    password: string;
    username?: string;
    phone?: string;
    role?: UserRole;
  }): Promise<any> {
    // 使用usersService创建用户
    const user = await this.usersService.create({
      ...registerData,
      role: registerData.role,
    });

    // 移除敏感信息
    const { password_hash, password_salt, ...result } = user;
    return result;
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('邮箱或密码不正确');
    }

    // 检查用户状态
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException('邮箱或密码不正确');
    }

    // 移除敏感信息
    const { password_hash, password_salt, ...result } = user;
    return result;
  }

  async login(user: any, ip: string) {
    // 更新登录统计
    await this.usersService.updateLoginStats(user.id, ip);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // 生成访问令牌
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '7d',
    });

    // 生成刷新令牌
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        expiresIn: '30d',
      },
    );

    // 将刷新令牌存储到Redis（30天过期）
    const refreshTokenKey = `refresh_token:${user.id}`;
    await this.redisClient.setex(refreshTokenKey, 2592000, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar_url: user.avatar_url,
        is_onboarding_completed: user.is_onboarding_completed,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // 验证刷新令牌
      const payload = this.jwtService.verify(refreshToken);
      
      // 检查刷新令牌是否在Redis中
      const refreshTokenKey = `refresh_token:${payload.sub}`;
      const storedToken = await this.redisClient.get(refreshTokenKey);
      
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('刷新令牌无效');
      }

      // 获取用户信息
      const user = await this.usersService.findOne(payload.sub);
      
      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('账号已被禁用');
      }

      // 生成新的访问令牌
      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '7d',
      });

      return {
        access_token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          avatar_url: user.avatar_url,
          is_onboarding_completed: user.is_onboarding_completed,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  async logout(userId: string) {
    // 从Redis中删除刷新令牌
    const refreshTokenKey = `refresh_token:${userId}`;
    await this.redisClient.del(refreshTokenKey);
    
    return { message: '登出成功' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // 出于安全考虑，不告诉用户邮箱不存在
      return { message: '如果邮箱存在，重置链接将发送到您的邮箱' };
    }

    // 生成重置令牌（15分钟有效期）
    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password_reset' },
      {
        expiresIn: '15m',
      },
    );

    // 将重置令牌存储到Redis（15分钟过期）
    const resetTokenKey = `password_reset:${user.id}:${resetToken}`;
    await this.redisClient.setex(resetTokenKey, 900, 'valid');

    // TODO: 发送重置邮件
    // 这里应该集成邮件服务发送重置链接
    
    return {
      message: '如果邮箱存在，重置链接将发送到您的邮箱',
      // 开发环境下返回令牌用于测试
      ...(process.env.NODE_ENV === 'development' && { reset_token: resetToken }),
    };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      // 验证重置令牌
      const payload = this.jwtService.verify(token);
      
      if (payload.type !== 'password_reset') {
        throw new BadRequestException('无效的重置令牌');
      }

      // 检查重置令牌是否在Redis中
      const resetTokenKey = `password_reset:${payload.sub}:${token}`;
      const isValid = await this.redisClient.get(resetTokenKey);
      
      if (!isValid) {
        throw new BadRequestException('重置令牌无效或已过期');
      }

      // 重置密码
      await this.usersService.resetPassword(payload.sub, newPassword);

      // 删除使用过的令牌
      await this.redisClient.del(resetTokenKey);

      // 使所有相关令牌失效
      await this.invalidateUserTokens(payload.sub);

      return { message: '密码重置成功' };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('重置令牌已过期');
      }
      throw new BadRequestException('无效的重置令牌');
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    await this.usersService.updatePassword(userId, oldPassword, newPassword);
    
    // 使所有相关令牌失效
    await this.invalidateUserTokens(userId);

    return { message: '密码修改成功' };
  }

  private async invalidateUserTokens(userId: string) {
    const keys = [
      `refresh_token:${userId}`,
      `password_reset:${userId}:*`,
    ];
    
    // 删除刷新令牌
    await this.redisClient.del(`refresh_token:${userId}`);
    
    // 删除所有重置令牌
    const pattern = `password_reset:${userId}:*`;
    const stream = this.redisClient.scanStream({
      match: pattern,
      count: 100,
    });
    
    const deletePromises: Promise<number>[] = [];
    stream.on('data', (keys: string[]) => {
      if (keys.length) {
        deletePromises.push(this.redisClient.del(...keys));
      }
    });
    
    return new Promise<void>((resolve) => {
      stream.on('end', async () => {
        await Promise.all(deletePromises);
        resolve();
      });
    });
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      
      // 检查用户状态
      const user = await this.usersService.findOne(payload.sub);
      
      if (user.status !== UserStatus.ACTIVE) {
        return { valid: false, reason: '账号已被禁用' };
      }

      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      return { valid: false, reason: '令牌无效或已过期' };
    }
  }
}
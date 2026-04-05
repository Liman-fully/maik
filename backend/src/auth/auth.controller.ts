import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功，返回用户信息和令牌' })
  @ApiResponse({ status: 409, description: '邮箱或手机号已被注册' })
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ip: string,
  ) {
    // 创建用户
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      username: registerDto.username || registerDto.email.split('@')[0],
      phone: registerDto.phone,
      role: registerDto.role,
    });

    // 生成令牌
    return this.authService.login(user, ip);
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功，返回访问令牌和刷新令牌' })
  @ApiResponse({ status: 401, description: '邮箱或密码不正确' })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
  ) {
    // 验证用户凭据
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    // 生成令牌
    return this.authService.login(user, ip);
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新访问令牌' })
  @ApiResponse({ status: 200, description: '返回新的访问令牌' })
  @ApiResponse({ status: 401, description: '刷新令牌无效' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户登出' })
  @ApiResponse({ status: 200, description: '登出成功' })
  async logout(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.authService.logout(userId);
  }

  @Post('password/reset/request')
  @ApiOperation({ summary: '请求密码重置' })
  @ApiResponse({ status: 200, description: '重置链接已发送到邮箱' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('password/reset')
  @ApiOperation({ summary: '重置密码' })
  @ApiResponse({ status: 200, description: '密码重置成功' })
  @ApiResponse({ status: 400, description: '重置令牌无效或已过期' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.new_password);
  }

  @Post('password/change')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密码' })
  @ApiResponse({ status: 200, description: '密码修改成功' })
  @ApiResponse({ status: 400, description: '旧密码不正确' })
  async changePassword(
    @Req() req: Request,
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = (req.user as any).id;
    return this.authService.changePassword(
      userId,
      dto.old_password,
      dto.new_password,
    );
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '验证访问令牌' })
  @ApiResponse({ status: 200, description: '令牌有效' })
  async validateToken(@Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return { valid: false, reason: '令牌不存在' };
    }

    return this.authService.validateToken(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前认证用户信息' })
  @ApiResponse({ status: 200, description: '返回用户信息' })
  async getCurrentUser(@Req() req: Request) {
    const userId = (req.user as any).id;
    const user = await this.usersService.findOne(userId);
    
    // 移除敏感信息
    const { password_hash, password_salt, ...userInfo } = user;
    return userInfo;
  }
}
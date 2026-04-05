import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';

export enum VerificationType {
  REGISTER = 'register',
  LOGIN = 'login',
  RESET_PASSWORD = 'reset_password',
  CHANGE_EMAIL = 'change_email',
  VERIFY_EMAIL = 'verify_email',
}

export class SendVerificationCodeDto {
  @ApiProperty({ description: '邮箱地址', example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({ 
    description: '验证类型', 
    enum: VerificationType,
    example: VerificationType.REGISTER
  })
  @IsEnum(VerificationType, { message: '验证类型不正确' })
  type: VerificationType;

  @ApiProperty({ description: '图形验证码令牌（可选）', required: false })
  @IsOptional()
  @IsString()
  captchaToken?: string;
}
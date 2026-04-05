import { ApiProperty } from '@nestjs/swagger';
import {
  IsString, IsNumber,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
} from 'class-validator';

export class RequestPasswordResetDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: '重置令牌' })
  @IsString()
  token: string;

  @ApiProperty({ description: '新密码，8-20位，包含字母和数字' })
  @IsString()
  @MinLength(8, { message: '密码至少8位' })
  @MaxLength(20, { message: '密码最多20位' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).*$/, {
    message: '密码必须包含字母和数字',
  })
  new_password: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: '旧密码' })
  @IsString()
  old_password: string;

  @ApiProperty({ description: '新密码，8-20位，包含字母和数字' })
  @IsString()
  @MinLength(8, { message: '密码至少8位' })
  @MaxLength(20, { message: '密码最多20位' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).*$/, {
    message: '密码必须包含字母和数字',
  })
  new_password: string;
}
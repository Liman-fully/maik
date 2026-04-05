import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNumber, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @MinLength(8, { message: '密码至少8位' })
  @MaxLength(20, { message: '密码最多20位' })
  password: string;
}
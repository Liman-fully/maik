import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsDateString,
  Matches,
} from 'class-validator';
import { Gender, UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({ description: '密码，8-20位，包含字母和数字' })
  @IsString()
  @MinLength(8, { message: '密码至少8位' })
  @MaxLength(20, { message: '密码最多20位' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).*$/, {
    message: '密码必须包含字母和数字',
  })
  password: string;

  @ApiPropertyOptional({ description: '用户名' })
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: '用户名最多30个字符' })
  username?: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @ApiPropertyOptional({ enum: Gender, description: '性别' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: '生日，格式：YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiPropertyOptional({ enum: UserRole, description: '用户角色' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: '所在地' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '所在地最多100个字符' })
  location?: string;

  @ApiPropertyOptional({ description: '公司' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '公司最多100个字符' })
  company?: string;

  @ApiPropertyOptional({ description: '职位' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '职位最多100个字符' })
  position?: string;
}
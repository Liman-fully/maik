import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateResumeExperienceDto {
  @ApiProperty({ description: '公司名称' })
  @IsString()
  company: string;

  @ApiProperty({ description: '职位名称' })
  @IsString()
  position: string;

  @ApiPropertyOptional({ description: '工作描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '开始日期，格式：YYYY-MM-DD' })
  @IsDateString()
  start_date: string;

  @ApiPropertyOptional({ description: '结束日期，格式：YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: '是否当前工作' })
  @IsOptional()
  @IsBoolean()
  is_current?: boolean;

  @ApiPropertyOptional({ description: '工作地点' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: '相关技能' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: '行业' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: '部门' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: '薪资' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salary?: number;

  @ApiPropertyOptional({ description: '薪资货币' })
  @IsOptional()
  @IsString()
  salary_currency?: string;

  @ApiPropertyOptional({ description: '主要成就' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  achievements?: string[];

  @ApiPropertyOptional({ description: '使用的技术' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @ApiPropertyOptional({ description: '雇佣类型' })
  @IsOptional()
  @IsString()
  employment_type?: string;

  @ApiPropertyOptional({ description: '团队规模' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  team_size?: number;
}
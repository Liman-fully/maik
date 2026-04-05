import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsDateString,
  IsArray,
} from 'class-validator';
import { SkillLevel } from '../entities/resume-skill.entity';

export class CreateResumeSkillDto {
  @ApiProperty({ description: '技能名称' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: SkillLevel, description: '技能水平' })
  @IsOptional()
  @IsEnum(SkillLevel)
  level?: SkillLevel;

  @ApiPropertyOptional({ description: '使用年限' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  years_of_experience?: number;

  @ApiPropertyOptional({ description: '技能类别' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '是否获得认证' })
  @IsOptional()
  @IsBoolean()
  is_certified?: boolean;

  @ApiPropertyOptional({ description: '认证名称' })
  @IsOptional()
  @IsString()
  certification_name?: string;

  @ApiPropertyOptional({ description: '认证日期，格式：YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  certification_date?: string;

  @ApiPropertyOptional({ description: '标签' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: '最近使用日期，格式：YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  last_used_date?: string;

  @ApiPropertyOptional({ description: '熟练度分数（0-100）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  proficiency_score?: number;

  @ApiPropertyOptional({ description: '技能描述' })
  @IsOptional()
  @IsString()
  description?: string;
}
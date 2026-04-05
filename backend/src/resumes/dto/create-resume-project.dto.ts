import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class TeamSizeDto {
  @IsOptional()
  @IsNumber()
  min?: number;

  @IsOptional()
  @IsNumber()
  max?: number;
}

class LinkDto {
  @IsString()
  name: string;

  @IsString()
  url: string;
}

export class CreateResumeProjectDto {
  @ApiProperty({ description: '项目名称' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '担任角色' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: '项目描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '开始日期，格式：YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: '结束日期，格式：YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: '是否当前项目' })
  @IsOptional()
  @IsBoolean()
  is_current?: boolean;

  @ApiPropertyOptional({ description: '公司/组织' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ description: '客户' })
  @IsOptional()
  @IsString()
  client?: string;

  @ApiPropertyOptional({ description: '使用的技术' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @ApiPropertyOptional({ description: '主要职责' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  responsibilities?: string[];

  @ApiPropertyOptional({ description: '主要成就' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  achievements?: string[];

  @ApiPropertyOptional({ type: TeamSizeDto, description: '团队规模' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TeamSizeDto)
  team_size?: TeamSizeDto;

  @ApiPropertyOptional({ description: '项目规模' })
  @IsOptional()
  @IsString()
  project_size?: string;

  @ApiPropertyOptional({ description: '行业' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: '项目链接' })
  @IsOptional()
  @IsString()
  project_url?: string;

  @ApiPropertyOptional({ description: '代码仓库链接' })
  @IsOptional()
  @IsString()
  repository_url?: string;

  @ApiPropertyOptional({ type: [LinkDto], description: '相关链接' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkDto)
  links?: LinkDto[];
}
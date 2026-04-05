import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsDate,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JobStatus, JobType, JobPriority } from '../entities/job.entity';

class JobRequirementDto {
  @ApiPropertyOptional({ description: '学历要求' })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional({ description: '工作经验要求（年）' })
  @IsOptional()
  @IsNumber()
  experience?: number;

  @ApiPropertyOptional({ description: '技能要求' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: '证书要求' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional({ description: '语言要求' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];
}

class JobSalaryDto {
  @ApiPropertyOptional({ description: '最低薪资' })
  @IsOptional()
  @IsNumber()
  min?: number;

  @ApiPropertyOptional({ description: '最高薪资' })
  @IsOptional()
  @IsNumber()
  max?: number;

  @ApiPropertyOptional({ description: '薪资货币' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: '薪资周期', enum: ['yearly', 'monthly', 'hourly'] })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ description: '是否面议' })
  @IsOptional()
  @IsString()
  negotiable?: boolean;
}

export class CreateJobDto {
  @ApiProperty({ description: '职位标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '职位描述' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: '职位类型', enum: JobType })
  @IsOptional()
  @IsEnum(JobType)
  type?: JobType;

  @ApiPropertyOptional({ description: '工作地点' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: '是否远程' })
  @IsOptional()
  @IsString()
  is_remote?: boolean;

  @ApiPropertyOptional({ description: '职位状态', enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ description: '职位优先级', enum: JobPriority })
  @IsOptional()
  @IsEnum(JobPriority)
  priority?: JobPriority;

  @ApiPropertyOptional({ description: '所属部门' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: '所属行业' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: '招聘人数' })
  @IsOptional()
  @IsNumber()
  openings?: number;

  @ApiPropertyOptional({ description: '职位要求' })
  @IsOptional()
  @ValidateNested()
  @Type(() => JobRequirementDto)
  requirements?: JobRequirementDto;

  @ApiPropertyOptional({ description: '薪资信息' })
  @IsOptional()
  @ValidateNested()
  @Type(() => JobSalaryDto)
  salary?: JobSalaryDto;

  @ApiPropertyOptional({ description: '福利待遇' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @ApiPropertyOptional({ description: '申请截止日期' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deadline?: Date;

  @ApiPropertyOptional({ description: '入职日期' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_date?: Date;

  @ApiPropertyOptional({ description: '职位标签' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: '是否公开' })
  @IsOptional()
  @IsString()
  is_public?: boolean;

  @ApiPropertyOptional({ description: '联系人姓名' })
  @IsOptional()
  @IsString()
  contact_name?: string;

  @ApiPropertyOptional({ description: '联系人邮箱' })
  @IsOptional()
  @IsString()
  contact_email?: string;

  @ApiPropertyOptional({ description: '联系人电话' })
  @IsOptional()
  @IsString()
  contact_phone?: string;

  @ApiPropertyOptional({ description: '公司介绍' })
  @IsOptional()
  @IsString()
  company_description?: string;

  @ApiPropertyOptional({ description: '团队介绍' })
  @IsOptional()
  @IsString()
  team_description?: string;
}

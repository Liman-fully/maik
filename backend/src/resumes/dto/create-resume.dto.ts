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
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ResumeStatus,
  ResumeVisibility,
  ResumeSource,
} from '../entities/resume.entity';
import { CreateResumeExperienceDto } from './create-resume-experience.dto';
import { CreateResumeEducationDto } from './create-resume-education.dto';
import { CreateResumeSkillDto } from './create-resume-skill.dto';
import { CreateResumeProjectDto } from './create-resume-project.dto';

export class CreateResumeDto {
  @ApiProperty({ description: '简历标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: '个人总结' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: '求职目标' })
  @IsOptional()
  @IsString()
  objective?: string;

  // 基本信息
  @ApiPropertyOptional({ description: '姓名' })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '所在地' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: '当前职位' })
  @IsOptional()
  @IsString()
  current_position?: string;

  @ApiPropertyOptional({ description: '当前公司' })
  @IsOptional()
  @IsString()
  current_company?: string;

  @ApiPropertyOptional({ description: '期望薪资' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expected_salary?: number;

  @ApiPropertyOptional({ description: '薪资货币' })
  @IsOptional()
  @IsString()
  salary_currency?: string;

  @ApiPropertyOptional({ description: '薪资周期' })
  @IsOptional()
  @IsString()
  salary_period?: string;

  @ApiPropertyOptional({ description: '首选工作地点' })
  @IsOptional()
  @IsString()
  preferred_location?: string;

  @ApiPropertyOptional({ description: '首选行业' })
  @IsOptional()
  @IsArray()
  preferred_industries?: string[];

  @ApiPropertyOptional({ description: '首选职位' })
  @IsOptional()
  @IsArray()
  preferred_positions?: string[];

  // 工作状态
  @ApiPropertyOptional({ description: '是否正在找工作' })
  @IsOptional()
  @IsBoolean()
  is_looking_for_job?: boolean;

  @ApiPropertyOptional({ description: '可开始工作时间，格式：YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  available_from?: string;

  @ApiPropertyOptional({ description: '工作偏好' })
  @IsOptional()
  @IsString()
  work_preference?: string;

  // 文件信息（上传时使用）
  @ApiPropertyOptional({ description: '文件URL' })
  @IsOptional()
  @IsString()
  file_url?: string;

  @ApiPropertyOptional({ description: '文件名' })
  @IsOptional()
  @IsString()
  file_name?: string;

  @ApiPropertyOptional({ description: '文件大小（字节）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  file_size?: number;

  @ApiPropertyOptional({ description: '文件类型' })
  @IsOptional()
  @IsString()
  file_type?: string;

  // 状态和可见性
  @ApiPropertyOptional({ enum: ResumeStatus, description: '简历状态' })
  @IsOptional()
  @IsEnum(ResumeStatus)
  status?: ResumeStatus;

  @ApiPropertyOptional({ enum: ResumeVisibility, description: '可见性' })
  @IsOptional()
  @IsEnum(ResumeVisibility)
  visibility?: ResumeVisibility;

  @ApiPropertyOptional({ enum: ResumeSource, description: '来源' })
  @IsOptional()
  @IsEnum(ResumeSource)
  source?: ResumeSource;

  // 关联数据
  @ApiPropertyOptional({ type: [CreateResumeExperienceDto], description: '工作经历' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateResumeExperienceDto)
  experiences?: CreateResumeExperienceDto[];

  @ApiPropertyOptional({ type: [CreateResumeEducationDto], description: '教育经历' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateResumeEducationDto)
  educations?: CreateResumeEducationDto[];

  @ApiPropertyOptional({ type: [CreateResumeSkillDto], description: '技能' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateResumeSkillDto)
  skills?: CreateResumeSkillDto[];

  @ApiPropertyOptional({ type: [CreateResumeProjectDto], description: '项目经历' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateResumeProjectDto)
  projects?: CreateResumeProjectDto[];

  @ApiPropertyOptional({ description: '解析数据' })
  @IsOptional()
  parsed_data?: Record<string, any>;
}
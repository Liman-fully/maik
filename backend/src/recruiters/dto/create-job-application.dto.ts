import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ApplicationCoverLetterDto {
  @ApiPropertyOptional({ description: '求职信内容' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '求职信附件URL' })
  @IsOptional()
  @IsString()
  attachment_url?: string;
}

class ApplicationResumeDto {
  @ApiPropertyOptional({ description: '简历ID' })
  @IsOptional()
  @IsString()
  resume_id?: string;

  @ApiPropertyOptional({ description: '简历URL' })
  @IsOptional()
  @IsString()
  resume_url?: string;

  @ApiPropertyOptional({ description: '自定义简历内容' })
  @IsOptional()
  @IsString()
  custom_resume?: string;
}

class ApplicationQuestionnaireDto {
  @ApiPropertyOptional({ description: '期望薪资' })
  @IsOptional()
  @IsNumber()
  expected_salary?: number;

  @ApiPropertyOptional({ description: '最快入职时间（天数）' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  available_in_days?: number;

  @ApiPropertyOptional({ description: '是否愿意异地工作' })
  @IsOptional()
  @IsBoolean()
  willing_to_relocate?: boolean;

  @ApiPropertyOptional({ description: '是否接受远程工作' })
  @IsOptional()
  @IsBoolean()
  accept_remote?: boolean;

  @ApiPropertyOptional({ description: '面试时间偏好' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interview_preferences?: string[];
}

export class CreateJobApplicationDto {
  @ApiProperty({ description: '职位ID' })
  @IsString()
  @IsNotEmpty()
  job_id: string;

  @ApiPropertyOptional({ description: '求职信信息' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationCoverLetterDto)
  cover_letter?: ApplicationCoverLetterDto;

  @ApiPropertyOptional({ description: '简历信息' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationResumeDto)
  resume?: ApplicationResumeDto;

  @ApiPropertyOptional({ description: '申请问卷' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationQuestionnaireDto)
  questionnaire?: ApplicationQuestionnaireDto;

  @ApiPropertyOptional({ description: '附加问题回答' })
  @IsOptional()
  @IsArray()
  additional_answers?: Array<{
    question: string;
    answer: string;
  }>;

  @ApiPropertyOptional({ description: '推荐人信息' })
  @IsOptional()
  @IsString()
  referrer?: string;

  @ApiPropertyOptional({ description: '推荐原因' })
  @IsOptional()
  @IsString()
  referral_reason?: string;

  @ApiPropertyOptional({ description: '申请来源' })
  @IsOptional()
  @IsString()
  source?: string; // website, app, referral, etc.

  @ApiPropertyOptional({ description: '自定义消息' })
  @IsOptional()
  @IsString()
  custom_message?: string;

  @ApiPropertyOptional({ description: '是否订阅职位更新' })
  @IsOptional()
  @IsBoolean()
  subscribe_updates?: boolean;
}
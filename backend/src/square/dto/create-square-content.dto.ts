import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, IsNumber, IsObject, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ContentType, ContentSubtype, VisibilityLevel, AvailabilityStatus } from '../entities/square-content.entity';

class SalaryRangeDto {
  @IsNumber()
  @Min(0)
  min: number;

  @IsNumber()
  @Min(0)
  max: number;

  @IsString()
  currency: string;

  @IsString()
  period: string;
}

class ExperienceRangeDto {
  @IsNumber()
  @Min(0)
  min: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max?: number;
}

class CompanyInfoDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  scale?: string;
}

export class CreateSquareContentDto {
  @IsEnum(ContentType)
  type: ContentType;

  @IsOptional()
  @IsEnum(ContentSubtype)
  subtype?: ContentSubtype;

  // 关联实体ID（可选）
  @IsOptional()
  @IsString()
  resumeId?: string;

  @IsOptional()
  @IsString()
  jobId?: string;

  // 通用属性
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // 权限控制
  @IsOptional()
  @IsEnum(VisibilityLevel)
  visibility?: VisibilityLevel = VisibilityLevel.PUBLIC;

  // 过期时间（对于招聘需求）
  @IsOptional()
  expiresAt?: Date;

  // 元数据
  @IsOptional()
  @IsObject()
  metadata?: {
    // 通用元数据
    location?: string;
    salary?: SalaryRangeDto;
    experience?: ExperienceRangeDto;
    education?: string[];
    skills?: string[];
    
    // 简历卡片特定
    currentPosition?: string;
    experienceYears?: number;
    availability?: AvailabilityStatus;
    
    // 招聘卡片特定
    company?: CompanyInfoDto;
    jobType?: string;
    experienceRequired?: ExperienceRangeDto;
    educationRequired?: string[];
    skillsRequired?: string[];
    
    // 分享卡片特定
    contentType?: string;
    sourceUrl?: string;
    estimatedReadTime?: number;
  };
}
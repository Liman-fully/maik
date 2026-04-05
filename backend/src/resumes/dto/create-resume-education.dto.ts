import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { EducationDegree } from '../entities/resume-education.entity';

export class CreateResumeEducationDto {
  @ApiProperty({ description: '学校/机构名称' })
  @IsString()
  institution: string;

  @ApiPropertyOptional({ enum: EducationDegree, description: '学位' })
  @IsOptional()
  @IsEnum(EducationDegree)
  degree?: EducationDegree;

  @ApiPropertyOptional({ description: '专业/领域' })
  @IsOptional()
  @IsString()
  field_of_study?: string;

  @ApiPropertyOptional({ description: '开始日期，格式：YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: '结束日期，格式：YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: '是否在读' })
  @IsOptional()
  @IsBoolean()
  is_current?: boolean;

  @ApiPropertyOptional({ description: '所在地' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'GPA' })
  @IsOptional()
  @IsString()
  gpa?: string;

  @ApiPropertyOptional({ description: 'GPA评分标准' })
  @IsOptional()
  @IsString()
  gpa_scale?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '相关课程' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  courses?: string[];

  @ApiPropertyOptional({ description: '荣誉奖项' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  honors?: string[];

  @ApiPropertyOptional({ description: '社团活动' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activities?: string[];
}
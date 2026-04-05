import { IsOptional, IsString, IsEnum, IsArray, IsObject, IsBoolean } from 'class-validator';
import { VisibilityLevel } from '../entities/square-content.entity';
import { PartialType } from '@nestjs/swagger';

export class UpdateSquareContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(VisibilityLevel)
  visibility?: VisibilityLevel;

  @IsOptional()
  expiresAt?: Date;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
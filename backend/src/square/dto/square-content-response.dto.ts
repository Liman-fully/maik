import { ContentType, ContentSubtype, VisibilityLevel, AvailabilityStatus } from '../entities/square-content.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class SquareContentResponseDto {
  id: string;
  type: ContentType;
  subtype?: ContentSubtype;
  
  // 关联实体信息
  resumeId?: string;
  jobId?: string;
  
  // 通用属性
  title: string;
  description: string;
  coverImage?: string;
  tags: string[];
  
  // 统计数据
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  bookmarkCount: number;
  
  // 用户信息
  author: UserResponseDto;
  authorRole: string;
  
  // 时间信息
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  
  // 权限控制
  visibility: VisibilityLevel;
  
  // 元数据
  metadata: Record<string, any>;
  
  // 交互状态
  userInteraction?: {
    liked: boolean;
    bookmarked: boolean;
    shared: boolean;
  };
  
  // 计算字段
  popularityScore?: number;
  relevanceScore?: number;
  
  // 关联实体预览信息
  resumePreview?: {
    id: string;
    name: string;
    currentPosition: string;
    experienceYears: number;
  };
  
  jobPreview?: {
    id: string;
    title: string;
    company: string;
    jobType: string;
  };
}
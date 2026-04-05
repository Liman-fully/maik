import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Resume } from '../../resumes/entities/resume.entity';
import { Job } from '../../recruiters/entities/job.entity';

export enum ContentType {
  RESUME = 'resume',
  JOB = 'job',
  SHARE = 'share'
}

export enum ContentSubtype {
  FULLTIME = 'fulltime',
  INTERNSHIP = 'internship',
  PARTTIME = 'parttime',
  CONTRACT = 'contract',
  TRAINING = 'training',
  QUESTION = 'question',
  EXPERIENCE = 'experience'
}

export enum VisibilityLevel {
  PUBLIC = 'public',
  CONNECTIONS = 'connections',
  PRIVATE = 'private'
}

export enum AvailabilityStatus {
  IMMEDIATE = 'immediate',
  ONE_MONTH = '1_month',
  THREE_MONTHS = '3_months',
  OPEN = 'open'
}

@Entity('square_contents')
@Index(['type', 'createdAt'])
@Index(['authorId', 'visibility'])
@Index(['expiresAt'], { where: '"expiresAt" IS NOT NULL' })
export class SquareContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ContentType,
    default: ContentType.SHARE
  })
  type: ContentType;

  @Column({
    type: 'enum',
    enum: ContentSubtype,
    nullable: true
  })
  subtype?: ContentSubtype;

  // 关联实体ID（简历或职位）
  @Column({ nullable: true })
  resumeId?: string;

  @Column({ nullable: true })
  jobId?: string;

  // 通用属性
  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  coverImage?: string;

  @Column('simple-array', { default: '' })
  tags: string[];

  // 统计数据
  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  commentCount: number;

  @Column({ default: 0 })
  shareCount: number;

  @Column({ default: 0 })
  bookmarkCount: number;

  // 用户信息
  @Column()
  authorId: string;

  @Column({
    type: 'enum',
    enum: ['seeker', 'recruiter', 'scout'],
    default: 'seeker'
  })
  authorRole: string;

  // 时间信息
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  expiresAt?: Date;

  // 权限控制
  @Column({
    type: 'enum',
    enum: VisibilityLevel,
    default: VisibilityLevel.PUBLIC
  })
  visibility: VisibilityLevel;

  // 元数据 - JSON字段存储不同类型特定数据
  @Column('jsonb', { default: {} })
  metadata: {
    // 通用元数据
    location?: string;
    salary?: {
      min: number;
      max: number;
      currency: string;
      period: string;
    };
    experience?: {
      min: number;
      max?: number;
    };
    education?: string[];
    skills?: string[];
    
    // 简历卡片特定
    currentPosition?: string;
    experienceYears?: number;
    availability?: AvailabilityStatus;
    
    // 招聘卡片特定
    company?: {
      name: string;
      logo?: string;
      scale?: string;
    };
    jobType?: string;
    experienceRequired?: {
      min: number;
      max?: number;
    };
    educationRequired?: string[];
    skillsRequired?: string[];
    
    // 分享卡片特定
    contentType?: string; // article/video/image
    sourceUrl?: string;
    estimatedReadTime?: number; // 分钟
  };

  // 关联关系
  @ManyToOne(() => User, user => user.squareContents)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @ManyToOne(() => Resume, { nullable: true })
  @JoinColumn({ name: 'resumeId' })
  resume?: Resume;

  @ManyToOne(() => Job, { nullable: true })
  @JoinColumn({ name: 'jobId' })
  job?: Job;

  // 计算字段（非数据库字段）
  popularityScore?: number;
  relevanceScore?: number;
  userInteraction?: {
    liked: boolean;
    bookmarked: boolean;
    shared: boolean;
  };
}
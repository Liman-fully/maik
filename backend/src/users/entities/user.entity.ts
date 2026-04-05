import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Resume } from '../../resumes/entities/resume.entity';
import { SquareContent } from '../../square/entities/square-content.entity';
import { Exclude } from 'class-transformer';

export enum UserRole {
  SEEKER = 'seeker', // 求职者
  HR = 'hr', // HR
  HEADHUNTER = 'headhunter', // 猎头
  ADMIN = 'admin', // 管理员
  JOB_SEEKER = 'job_seeker', // 求职者(旧版兼容)
  USER = 'user', // 普通用户
  GUEST = 'guest', // 访客
  MODERATOR = 'moderator', // 版主
  SUPER_MODERATOR = 'super_moderator', // 超级版主
  RECRUITER = 'recruiter', // 招聘者
  VERIFIED_USER = 'verified_user', // 已验证用户
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ nullable: true, unique: true })
  @Index()
  phone?: string;

  @Column()
  @Exclude()
  password_hash: string;

  @Column()
  @Exclude()
  password_salt: string;

  @Column({ nullable: true })
  username?: string;

  @Column({ nullable: true })
  avatar_url?: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ type: 'enum', enum: Gender, default: Gender.PREFER_NOT_TO_SAY })
  gender: Gender;

  @Column({ type: 'date', nullable: true })
  birthday?: Date;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.SEEKER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  company?: string;

  @Column({ nullable: true })
  position?: string;

  @Column({ default: 0 })
  experience_years: number;

  @Column({ nullable: true })
  industry?: string;

  @Column({ default: 0 })
  credit_points: number; // 积分

  @Column({ default: 0 })
  trust_score: number; // 信任分数 0-100

  @Column({ default: 0 })
  total_connections: number; // 总连接数

  @Column({ default: false })
  is_public: boolean; // 是否公开资料

  @Column({ default: false })
  is_verified: boolean; // 是否已验证

  @Column({ default: false })
  is_onboarding_completed: boolean; // 是否完成新手引导

  @Column({ type: 'timestamp', nullable: true })
  last_login_at?: Date;

  @Column({ nullable: true })
  last_login_ip?: string;

  @Column({ default: 0 })
  login_count: number;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // 关联简历
  @OneToMany(() => Resume, (resume) => resume.user)
  resumes: Resume[];

  // 关联广场内容
  @OneToMany(() => SquareContent, (content) => content.author)
  squareContents: SquareContent[];

  // 计算属性：获取显示名称
  get displayName(): string {
    return this.username || this.email.split('@')[0];
  }
}
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ResumeExperience } from './resume-experience.entity';
import { ResumeEducation } from './resume-education.entity';
import { ResumeSkill } from './resume-skill.entity';
import { ResumeProject } from './resume-project.entity';

export enum ResumeStatus {
  DRAFT = 'draft', // 草稿
  ACTIVE = 'active', // 活跃
  ARCHIVED = 'archived', // 归档
  DELETED = 'deleted', // 删除
}

export enum ResumeVisibility {
  PUBLIC = 'public', // 公开
  PRIVATE = 'private', // 私有
  CONNECTIONS_ONLY = 'connections_only', // 仅联系人可见
}

export enum ResumeSource {
  UPLOAD = 'upload', // 上传
  MANUAL = 'manual', // 手动创建
  PARSED = 'parsed', // 解析生成
  IMPORTED = 'imported', // 导入
}

@Entity('resumes')
export class Resume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ type: 'text', nullable: true })
  objective?: string;

  // 基本信息
  @Column({ nullable: true })
  full_name?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  avatar_url?: string;

  @Column({ nullable: true })
  current_position?: string;

  @Column({ nullable: true })
  current_company?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  expected_salary?: number;

  @Column({ nullable: true })
  salary_currency?: string;

  @Column({ nullable: true })
  salary_period?: string; // yearly, monthly, hourly

  @Column({ nullable: true })
  preferred_location?: string;

  @Column({ type: 'jsonb', nullable: true })
  preferred_industries?: string[];

  @Column({ type: 'jsonb', nullable: true })
  preferred_positions?: string[];

  // 工作状态
  @Column({ default: false })
  is_looking_for_job: boolean;

  @Column({ type: 'date', nullable: true })
  available_from?: Date;

  @Column({ nullable: true })
  work_preference?: string; // full_time, part_time, remote, hybrid

  // 文件信息
  @Column({ nullable: true })
  file_url?: string;

  @Column({ nullable: true })
  file_name?: string;

  @Column({ nullable: true })
  file_size?: number;

  @Column({ nullable: true })
  file_type?: string;

  @Column({ nullable: true })
  original_file_hash?: string;

  // 解析信息
  @Column({ type: 'jsonb', nullable: true })
  parsed_data?: Record<string, any>;

  @Column({ nullable: true })
  parsing_status?: string;

  @Column({ type: 'timestamp', nullable: true })
  parsed_at?: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  parsing_confidence?: number;

  // 状态和可见性
  @Column({ type: 'enum', enum: ResumeStatus, default: ResumeStatus.ACTIVE })
  status: ResumeStatus;

  @Column({
    type: 'enum',
    enum: ResumeVisibility,
    default: ResumeVisibility.PRIVATE,
  })
  visibility: ResumeVisibility;

  @Column({ type: 'enum', enum: ResumeSource, default: ResumeSource.MANUAL })
  source: ResumeSource;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ default: 0 })
  view_count: number;

  @Column({ default: 0 })
  download_count: number;

  @Column({ default: 0 })
  match_score: number; // 匹配度分数 0-100

  @Column({ default: 0 })
  total_experience: number; // 总工作经验(年)

  // 时间戳
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_updated_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_viewed_at?: Date;

  // 关联关系
  @ManyToOne(() => User, (user) => user.resumes)
  user: User;

  @Column()
  user_id: string;

  @OneToMany(() => ResumeExperience, (experience) => experience.resume)
  experiences: ResumeExperience[];

  @OneToMany(() => ResumeEducation, (education) => education.resume)
  educations: ResumeEducation[];

  @OneToMany(() => ResumeSkill, (skill) => skill.resume)
  skills: ResumeSkill[];

  @OneToMany(() => ResumeProject, (project) => project.resume)
  projects: ResumeProject[];

  // 索引
  @Index()
  @Column()
  is_looking_for_job_index: boolean;

  @Index()
  @Column()
  visibility_index: ResumeVisibility;

  @Index()
  @Column({ nullable: true })
  location_index?: string;

  @Index()
  @Column({ nullable: true })
  current_position_index?: string;

  @Index()
  @Column({ nullable: true })
  preferred_location_index?: string;

  // 计算属性
  get totalExperience(): number {
    // 如果已经计算过，直接返回存储的值
    if (this.total_experience > 0) {
      return this.total_experience;
    }
    
    if (!this.experiences || this.experiences.length === 0) return 0;
    
    const now = new Date();
    let totalMonths = 0;
    
    this.experiences.forEach(exp => {
      const startDate = new Date(exp.start_date);
      const endDate = exp.end_date ? new Date(exp.end_date) : now;
      
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      
      totalMonths += diffMonths;
    });
    
    const years = Math.floor(totalMonths / 12);
    
    // 存储计算的结果
    this.total_experience = years;
    
    return years;
  }

  get hasFile(): boolean {
    return !!this.file_url;
  }

  get isPublic(): boolean {
    return this.visibility === ResumeVisibility.PUBLIC;
  }

  get isParsed(): boolean {
    return this.parsing_status === 'completed' && !!this.parsed_data;
  }
}
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Resume } from '../../resumes/entities/resume.entity';

// ==================== ENUMS ====================

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERN = 'intern',
  INTERNSHIP = 'internship',
  TEMPORARY = 'temporary',
  FREELANCE = 'freelance',
  REMOTE = 'remote',
}

export enum JobStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
  OPEN = 'open',
  FILLED = 'filled',
  CANCELLED = 'cancelled',
}

export enum JobPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ApplicationStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  SHORTLISTED = 'shortlisted',
  INTERVIEWING = 'interviewing',
  OFFERED = 'offered',
  HIRED = 'hired',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  ARCHIVED = 'archived',
}

export enum ApplicationSource {
  DIRECT_APPLY = 'direct_apply',
  HEADHUNTER_SUBMISSION = 'headhunter_submission',
  REFERRAL = 'referral',
  IMPORTED = 'imported',
}

// ==================== JOB ENTITY ====================

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 基础字段（jobs模块）
  @Column()
  @Index()
  recruiter_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recruiter_id' })
  recruiter: User;

  @Column()
  title: string;

  @Column()
  company: string;

  @Column()
  location: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'int', nullable: true })
  salary_min?: number;

  @Column({ type: 'int', nullable: true })
  salary_max?: number;

  @Column({ default: 'monthly' })
  salary_type: string;

  @Column({ nullable: true })
  experience_required?: string;

  @Column({ nullable: true })
  education_required?: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  requirements?: string[];

  @Column({ type: 'simple-array', nullable: true })
  benefits?: string[];

  @Column({ type: 'simple-array', nullable: true })
  skills?: string[];

  @Column({ nullable: true })
  category?: string;

  @Column({
    type: 'enum',
    enum: JobType,
    default: JobType.FULL_TIME,
  })
  type: JobType;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.DRAFT,
  })
  status: JobStatus;

  @Column({ default: 0 })
  applicants_count: number;

  @Column({ default: 0 })
  views_count: number;

  @Column({ type: 'timestamp', nullable: true })
  expires_at?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ==================== recruiters 扩展字段 ====================

  @Column({ type: 'text', nullable: true })
  responsibilities?: string;

  @Column({ type: 'enum', enum: JobPriority, default: JobPriority.MEDIUM, nullable: true })
  priority?: JobPriority;

  @Column({ default: false })
  is_public?: boolean;

  @Column({ default: false })
  is_remote?: boolean;

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  industry?: string;

  @Column({ default: 1, nullable: true })
  openings?: number;

  @Column({ type: 'date', nullable: true })
  deadline?: Date;

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[];

  // 公司扩展信息
  @Column({ nullable: true })
  company_name?: string;

  @Column({ nullable: true })
  company_logo?: string;

  @Column({ nullable: true })
  company_website?: string;

  @Column({ nullable: true })
  company_description?: string;

  @Column({ type: 'jsonb', nullable: true })
  company_industry?: string[];

  @Column({ nullable: true })
  company_size?: string;

  // 猎头相关
  @Column({ default: false })
  is_assigned_to_headhunter?: boolean;

  @Column({ nullable: true })
  assigned_headhunter_id?: string;

  @Column({ type: 'timestamp', nullable: true })
  assigned_at?: Date;

  // 统计
  @Column({ default: 0 })
  shortlisted_count?: number;

  @Column({ default: 0 })
  interviewed_count?: number;

  @Column({ default: 0 })
  hired_count?: number;

  // 薪资扩展
  @Column({ nullable: true })
  salary_currency?: string;

  @Column({ nullable: true })
  salary_period?: string;

  @Column({ nullable: true })
  salary_note?: string;

  // 其他
  @Column({ nullable: true })
  hiring_manager?: string;

  @Column({ type: 'date', nullable: true })
  posted_date?: Date;

  @Column({ type: 'date', nullable: true })
  application_deadline?: Date;

  @Column({ type: 'date', nullable: true })
  expected_start_date?: Date;

  @Column({ type: 'date', nullable: true })
  filled_date?: Date;

  // 佣金
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  commission_rate?: number;

  @Column({ nullable: true })
  commission_type?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  commission_amount?: number;

  @Column({ type: 'date', nullable: true })
  commission_payment_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deadline_for_headhunter?: Date;

  @Column({ default: 0 })
  headhunter_submissions?: number;

  @Column({ nullable: true })
  work_location?: string;

  // 要求
  @Column({ type: 'int', nullable: true })
  experience_min?: number;

  @Column({ type: 'int', nullable: true })
  experience_max?: number;

  @Column({ nullable: true })
  education_level?: string;

  @Column({ type: 'jsonb', nullable: true })
  required_skills?: string[];

  @Column({ type: 'jsonb', nullable: true })
  preferred_skills?: string[];

  @Column({ type: 'jsonb', nullable: true })
  languages?: Array<{ language: string; level: string }>;

  // view_count 别名（兼容）
  get view_count(): number {
    return this.views_count;
  }

  // posted_by 关系别名（兼容）
  get posted_by(): User {
    return this.recruiter;
  }

  // refresh 实体
  @Column({ type: 'timestamp', nullable: true })
  refreshed_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_viewed_at?: Date;

  // Applications relation
  @OneToMany(() => JobApplication, (application: JobApplication) => application.job)
  applications?: JobApplication[];

  // 计算属性
  get isActive(): boolean {
    return this.status === JobStatus.OPEN || this.status === JobStatus.ACTIVE;
  }

  get hasDeadlinePassed(): boolean {
    if (!this.application_deadline) return false;
    return new Date(this.application_deadline) < new Date();
  }

  get salaryRange(): string {
    if (this.salary_min && this.salary_max) {
      return `${this.salary_min} - ${this.salary_max} ${this.salary_currency || ''}`;
    } else if (this.salary_min) {
      return `从 ${this.salary_min} ${this.salary_currency || ''}`;
    } else if (this.salary_max) {
      return `至 ${this.salary_max} ${this.salary_currency || ''}`;
    }
    return '面议';
  }

  get applicationProgress(): number {
    if (!this.openings || this.openings === 0) return 0;
    return Math.min(100, ((this.hired_count || 0) / this.openings) * 100);
  }

  get isUrgent(): boolean {
    return this.priority === JobPriority.URGENT;
  }

  get daysSincePosted(): number {
    if (!this.posted_date) return 0;
    const diffTime = Math.abs(new Date().getTime() - new Date(this.posted_date).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// ==================== JOB APPLICATION ENTITY ====================

@Entity('job_applications')
export class JobApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  job_id: string;

  @ManyToOne(() => Job, (job: Job) => job.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column()
  @Index()
  applicant_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'applicant_id' })
  applicant: User;

  @Column()
  resume_id: string;

  @ManyToOne(() => Resume, { onDelete: 'CASCADE' })
  resume: Resume;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  @Column({
    type: 'enum',
    enum: ApplicationSource,
    default: ApplicationSource.DIRECT_APPLY,
  })
  source: ApplicationSource;

  @Column({ type: 'text', nullable: true })
  cover_letter?: string;

  // 匹配度信息
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  match_score?: number;

  @Column({ type: 'jsonb', nullable: true })
  match_details?: {
    skills: number;
    experience: number;
    education: number;
    location: number;
    salary: number;
  };

  @Column({ type: 'text', nullable: true })
  match_notes?: string;

  // 面试信息
  @Column({ type: 'timestamp', nullable: true })
  viewed_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  interviewed_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  first_interview_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  second_interview_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  final_interview_date?: Date;

  @Column({ type: 'jsonb', nullable: true })
  interview_info?: {
    type: string;
    location?: string;
    time?: Date;
    interviewer?: string;
    notes?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  interview_notes?: Array<{
    date: Date;
    interviewer: string;
    notes: string;
    rating?: number;
  }>;

  // 录用信息
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  offered_salary?: number;

  @Column({ nullable: true })
  offered_salary_currency?: string;

  @Column({ type: 'date', nullable: true })
  offered_start_date?: Date;

  @Column({ type: 'text', nullable: true })
  offer_notes?: string;

  @Column({ type: 'timestamp', nullable: true })
  offer_sent_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  offer_accepted_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  offer_declined_date?: Date;

  // 拒绝信息
  @Column({ type: 'text', nullable: true })
  rejection_reason?: string;

  @Column({ type: 'timestamp', nullable: true })
  rejected_date?: Date;

  // 撤回信息
  @Column({ type: 'text', nullable: true })
  withdrawal_reason?: string;

  @Column({ type: 'timestamp', nullable: true })
  withdrawn_date?: Date;

  // 猎头相关
  @Column({ nullable: true })
  headhunter_id?: string;

  @Column({ nullable: true })
  headhunter_name?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  headhunter_commission?: number;

  @Column({ nullable: true })
  headhunter_commission_type?: string;

  @Column({ type: 'date', nullable: true })
  headhunter_commission_paid_date?: Date;

  // 时间戳
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  status_changed_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_contacted_at?: Date;

  // applied_at 别名（兼容）
  @Column({ type: 'timestamp', nullable: true })
  applied_at?: Date;

  get isActive(): boolean {
    const inactiveStatuses = [
      ApplicationStatus.HIRED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
      ApplicationStatus.ARCHIVED,
    ];
    return !inactiveStatuses.includes(this.status);
  }

  get daysSinceApplied(): number {
    const appliedDate = this.applied_at || this.created_at;
    const diffTime = Math.abs(new Date().getTime() - new Date(appliedDate).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isShortlisted(): boolean {
    return [
      ApplicationStatus.SHORTLISTED,
      ApplicationStatus.INTERVIEWING,
      ApplicationStatus.OFFERED,
      ApplicationStatus.HIRED,
    ].includes(this.status);
  }

  get isInProcess(): boolean {
    return [
      ApplicationStatus.REVIEWING,
      ApplicationStatus.SHORTLISTED,
      ApplicationStatus.INTERVIEWING,
      ApplicationStatus.OFFERED,
    ].includes(this.status);
  }

  get isFinal(): boolean {
    return [
      ApplicationStatus.HIRED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
    ].includes(this.status);
  }

  get hasOffer(): boolean {
    return [
      ApplicationStatus.OFFERED,
      ApplicationStatus.HIRED,
    ].includes(this.status);
  }

  updateStatus(newStatus: ApplicationStatus) {
    const oldStatus = this.status;
    this.status = newStatus;
    this.status_changed_at = new Date();
    return { oldStatus, newStatus };
  }
}

// ==================== JOB FAVORITE ENTITY ====================

@Entity('job_favorites')
export class JobFavorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  @Index()
  job_id: string;

  @ManyToOne(() => Job)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @CreateDateColumn()
  created_at: Date;
}

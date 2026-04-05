import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Job } from './job.entity';
import { User } from '../../users/entities/user.entity';

export enum AssignmentStatus {
  PENDING = 'pending', // 待接受
  ACCEPTED = 'accepted', // 已接受
  IN_PROGRESS = 'in_progress', // 进行中
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
  EXPIRED = 'expired', // 已过期
}

export enum AssignmentType {
  EXCLUSIVE = 'exclusive', // 独家
  NON_EXCLUSIVE = 'non_exclusive', // 非独家
  FIRST_FILL = 'first_fill', // 先到先得
}

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AssignmentStatus, default: AssignmentStatus.PENDING })
  status: AssignmentStatus;

  @Column({ type: 'enum', enum: AssignmentType, default: AssignmentType.NON_EXCLUSIVE })
  type: AssignmentType;

  // 派单条件
  @Column({ type: 'text', nullable: true })
  requirements?: string;

  @Column({ type: 'jsonb', nullable: true })
  candidate_criteria?: {
    experience_min?: number;
    experience_max?: number;
    education_level?: string[];
    required_skills?: string[];
    preferred_skills?: string[];
    location_preference?: string[];
  };

  @Column({ default: 3 })
  candidate_quota: number; // 需要推荐候选人数量

  @Column({ default: 0 })
  candidates_submitted: number;

  @Column({ default: 0 })
  candidates_shortlisted: number;

  @Column({ default: 0 })
  candidates_interviewed: number;

  @Column({ default: 0 })
  candidates_hired: number;

  // 费用信息
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commission_rate: number;

  @Column()
  commission_type: string; // percentage, fixed

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  commission_amount?: number;

  @Column({ nullable: true })
  commission_payment_terms?: string;

  @Column({ type: 'date', nullable: true })
  commission_payment_date?: Date;

  // 时间限制
  @Column({ type: 'timestamp' })
  deadline: Date;

  @Column({ type: 'timestamp', nullable: true })
  accepted_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at?: Date;

  // 绩效指标
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  performance_score?: number; // 0-100

  @Column({ type: 'text', nullable: true })
  performance_feedback?: string;

  @Column({ type: 'jsonb', nullable: true })
  performance_metrics?: {
    response_time?: number; // 小时
    submission_quality?: number; // 0-100
    communication_score?: number; // 0-100
  };

  // 沟通记录
  @Column({ type: 'jsonb', nullable: true })
  communication_log?: Array<{
    date: Date;
    type: string; // email, call, message
    summary: string;
    notes?: string;
  }>;

  // 元数据
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // 关联关系
  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  job: Job;

  @Column()
  job_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  hr_user: User; // HR用户

  @Column()
  hr_user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  headhunter_user: User; // 猎头用户

  @Column()
  headhunter_user_id: string;

  // 索引
  @Index()
  @Column()
  status_index: AssignmentStatus;

  @Index()
  @Column()
  type_index: AssignmentType;

  @Index()
  @Column()
  hr_user_id_index: string;

  @Index()
  @Column()
  headhunter_user_id_index: string;

  // 计算属性
  get isActive(): boolean {
    return [
      AssignmentStatus.ACCEPTED,
      AssignmentStatus.IN_PROGRESS,
    ].includes(this.status);
  }

  get isCompleted(): boolean {
    return this.status === AssignmentStatus.COMPLETED;
  }

  get daysUntilDeadline(): number {
    const diffTime = Math.abs(new Date(this.deadline).getTime() - new Date().getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isUrgent(): boolean {
    return this.daysUntilDeadline <= 3;
  }

  get submissionRate(): number {
    if (this.candidate_quota === 0) return 0;
    return (this.candidates_submitted / this.candidate_quota) * 100;
  }

  get successRate(): number {
    if (this.candidates_submitted === 0) return 0;
    return (this.candidates_hired / this.candidates_submitted) * 100;
  }

  get canSubmitMore(): boolean {
    return this.candidates_submitted < this.candidate_quota;
  }

  get quotaRemaining(): number {
    return this.candidate_quota - this.candidates_submitted;
  }

  // 状态变更方法
  acceptAssignment() {
    if (this.status !== AssignmentStatus.PENDING) {
      throw new Error('只能接受待处理的派单');
    }
    this.status = AssignmentStatus.ACCEPTED;
    this.accepted_at = new Date();
  }

  startAssignment() {
    if (this.status !== AssignmentStatus.ACCEPTED) {
      throw new Error('只能开始已接受的派单');
    }
    this.status = AssignmentStatus.IN_PROGRESS;
    this.started_at = new Date();
  }

  completeAssignment() {
    if (this.status !== AssignmentStatus.IN_PROGRESS) {
      throw new Error('只能完成进行中的派单');
    }
    this.status = AssignmentStatus.COMPLETED;
    this.completed_at = new Date();
  }

  cancelAssignment(reason?: string) {
    this.status = AssignmentStatus.CANCELLED;
    this.cancelled_at = new Date();
    if (reason) {
      this.metadata = { ...this.metadata, cancellation_reason: reason };
    }
  }

  // 候选人计数方法
  incrementSubmission() {
    if (!this.canSubmitMore) {
      throw new Error('已达到候选人配额限制');
    }
    this.candidates_submitted += 1;
  }

  incrementShortlisted() {
    this.candidates_shortlisted += 1;
  }

  incrementInterviewed() {
    this.candidates_interviewed += 1;
  }

  incrementHired() {
    this.candidates_hired += 1;
  }
}
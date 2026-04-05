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

export enum BoleLevel {
  B0 = 'B0', // 试用伯乐
  B1 = 'B1', // 见习伯乐
  B2 = 'B2', // 正式伯乐
  B3 = 'B3', // 资深伯乐
  B4 = 'B4', // 明星伯乐
}

export enum ReferralStatus {
  PENDING = 'pending',       // 待处理
  VIEWED = 'viewed',         // 已查看
  INTERVIEWED = 'interviewed', // 面试中
  HIRED = 'hired',           // 已入职
  REJECTED = 'rejected',     // 已拒绝
}

@Entity('bole_profiles')
export class BoleProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: BoleLevel,
    default: BoleLevel.B0,
  })
  level: BoleLevel;

  @Column({ default: 0 })
  total_referrals: number;

  @Column({ default: 0 })
  successful_referrals: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_earnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pending_earnings: number;

  @Column({ default: 0 })
  available_resumes: number;

  @Column({ default: 10 })
  max_resumes: number;

  @Column({ default: 0 })
  monthly_referrals: number;

  @Column({ default: 3 })
  max_monthly_referrals: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  rating_count: number;

  @Column({ type: 'simple-array', nullable: true })
  specialties: string[];

  @Column({ type: 'text', nullable: true })
  introduction?: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ type: 'simple-array', nullable: true })
  badges: string[];

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // 关联推荐记录
  @OneToMany(() => BoleReferral, (referral) => referral.bole)
  referrals: BoleReferral[];

  // 计算分成比例
  get commission_rate(): number {
    const rates: Record<BoleLevel, number> = {
      [BoleLevel.B0]: 0.60,
      [BoleLevel.B1]: 0.60,
      [BoleLevel.B2]: 0.60,
      [BoleLevel.B3]: 0.65,
      [BoleLevel.B4]: 0.70,
    };
    return rates[this.level];
  }
}

@Entity('bole_referrals')
export class BoleReferral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  bole_id: string;

  @ManyToOne(() => BoleProfile, (profile) => profile.referrals)
  @JoinColumn({ name: 'bole_id' })
  bole: BoleProfile;

  @Column()
  @Index()
  resume_id: string;

  @Column({ nullable: true })
  job_id?: string;

  @Column({
    type: 'enum',
    enum: ReferralStatus,
    default: ReferralStatus.PENDING,
  })
  status: ReferralStatus;

  @Column({ type: 'int', default: 0 })
  reward_points: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  reward_amount: number;

  @Column({ type: 'timestamp', nullable: true })
  hired_at?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

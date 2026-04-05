import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  EARN = 'earn',
  SPEND = 'spend',
}

export enum TransactionCategory {
  // 收入类型
  RECHARGE = 'recharge',           // 充值
  REFERRAL_REWARD = 'referral_reward', // 推荐奖励
  BONUS = 'bonus',                 // 平台赠送
  REFUND = 'refund',               // 退款
  ACTIVITY = 'activity',           // 活动奖励
  PROFILE_COMPLETION = 'profile_completion', // 资料完善
  VERIFICATION = 'verification',   // 验证奖励
  RESUME_UPLOAD = 'resume_upload', // 简历上传
  RESUME_UPDATE = 'resume_update', // 简历更新
  INTERACTION = 'interaction',     // 互动奖励
  INVITATION = 'invitation',       // 邀请奖励
  
  // 支出类型
  RESUME_VIEW = 'resume_view',         // 简历查看
  RESUME_DOWNLOAD = 'resume_download',     // 简历下载
  CONTACT_UNLOCK = 'contact_unlock',       // 解锁联系方式
  CONTACT = 'contact',                     // 联系候选人
  EXPERIENCE_UNLOCK = 'experience_unlock', // 解锁详细经历
  JOB_POST = 'job_post',                   // 发布职位
  JOB_BOOST = 'job_boost',                 // 职位曝光加速
  JOB_REFRESH = 'job_refresh',             // 职位刷新
  SEARCH = 'search',                       // 高级搜索
  RECOMMENDATION = 'recommendation',       // 推荐服务
  BOOST = 'boost',                         // 曝光加速
  OTHER = 'other',                         // 其他类型
}

@Entity('credit_transactions')
export class CreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int' })
  amount: number; // 正数为收入，负数为支出

  @Column({ type: 'int' })
  balance_after: number; // 交易后余额

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionCategory,
  })
  category: TransactionCategory;

  @Column()
  description: string;

  @Column({ nullable: true })
  related_id?: string; // 关联的简历/职位/订单ID

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  @Index()
  created_at: Date;
}

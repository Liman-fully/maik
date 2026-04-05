import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, BeforeInsert } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Conversation } from './conversation.entity';

export enum MessageType {
  TEXT = 'text',
  RICH_TEXT = 'rich_text',
  RESUME_SHARE = 'resume_share',
  JOB_SHARE = 'job_share',
  INTERVIEW_INVITATION = 'interview_invitation',
  SALARY_OFFER = 'salary_offer',
  CONTRACT_TERMS = 'contract_terms',
  QUICK_REPLY = 'quick_reply',
  POLL = 'poll',
  CALENDAR_INVITE = 'calendar_invite',
  DOCUMENT = 'document',
  IMAGE = 'image',
  VIDEO = 'video',
  VOICE = 'voice',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Entity('messages')
@Index(['conversationId', 'createdAt'])
@Index(['senderId', 'createdAt'])
@Index(['conversationId', 'status'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversationId: string;

  @Column()
  senderId: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT
  })
  type: MessageType;

  @Column('text')
  content: string;

  // 结构化消息内容（JSON格式）
  @Column('jsonb', { default: {} })
  structuredContent: {
    // 通用字段
    text?: string;
    attachments?: Array<{
      id: string;
      type: string;
      url: string;
      name: string;
      size?: number;
      thumbnail?: string;
    }>;
    
    // 简历分享特定字段
    resume?: {
      id: string;
      name: string;
      preview: string;
      downloadUrl?: string;
    };
    
    // 职位分享特定字段
    job?: {
      id: string;
      title: string;
      company: string;
      preview: string;
    };
    
    // 面试邀请特定字段
    interviewInvitation?: {
      company: {
        name: string;
        logo?: string;
        industry?: string;
      };
      position: {
        title: string;
        department?: string;
        level?: string;
      };
      interview: {
        type: string;
        round: number;
        totalRounds?: number;
        scheduledTime: string;
        duration: number;
        format: string;
        platform: string;
        meetingLink?: string;
        interviewer?: {
          name: string;
          position: string;
          avatar?: string;
        };
      };
      preparation?: {
        topics: string[];
        materials?: string[];
        dressCode?: string;
      };
      nextSteps?: string[];
    };
    
    // 薪资offer特定字段
    salaryOffer?: {
      baseSalary: number;
      bonus?: number;
      stock?: number;
      benefits: string[];
      currency: string;
      period: string;
      startDate: string;
      responseDeadline?: string;
    };
    
    // 快速回复选项
    quickReplies?: Array<{
      id: string;
      text: string;
      value: any;
    }>;
    
    // 投票选项
    poll?: {
      question: string;
      options: Array<{
        id: string;
        text: string;
        votes: number;
        voters?: string[];
      }>;
      multipleChoice: boolean;
      endTime?: string;
    };
    
    // 日历邀请
    calendarInvite?: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      timezone: string;
      location?: string;
      platform?: string;
      link?: string;
      attendees: Array<{
        userId: string;
        email: string;
        name: string;
        status?: string;
      }>;
    };
  };

  // 消息元数据
  @Column('jsonb', { default: {} })
  metadata: {
    // 文件消息相关
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    duration?: number; // 语音/视频时长（秒）
    dimensions?: { width: number; height: number }; // 图片/视频尺寸
    
    // 交互相关
    replyToMessageId?: string;
    forwardFromMessageId?: string;
    editHistory?: Array<{ text: string; timestamp: Date }>;
    
    // 送达相关
    readReceipts?: Array<{ userId: string; readAt: Date }>;
    deliveryReceipts?: Array<{ userId: string; deliveredAt: Date }>;
    
    // 加密相关
    encrypted?: boolean;
    encryptionKey?: string;
  };

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT
  })
  status: MessageStatus;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  deletedAt?: Date;

  @Column({ nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Conversation, conversation => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  // 回复的消息
  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'replyToMessageId' })
  replyTo?: Message;

  @Column({ nullable: true })
  replyToMessageId?: string;

  // 计算字段（非数据库字段）
  preview?: string;
  isCurrentUser?: boolean;
  reactions?: Array<{ type: string; userId: string; count: number }>;

  @BeforeInsert()
  generatePreview() {
    // 根据消息类型生成预览文本
    if (this.type === MessageType.TEXT || this.type === MessageType.RICH_TEXT) {
      this.preview = this.content.length > 100 
        ? this.content.substring(0, 100) + '...'
        : this.content;
    } else if (this.type === MessageType.IMAGE) {
      this.preview = '[图片]';
    } else if (this.type === MessageType.VOICE) {
      this.preview = '[语音消息]';
    } else if (this.type === MessageType.RESUME_SHARE) {
      this.preview = '[简历分享]';
    } else if (this.type === MessageType.INTERVIEW_INVITATION) {
      this.preview = '[面试邀请]';
    } else {
      this.preview = `[${this.type}]`;
    }
  }
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable, BeforeInsert, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Message } from './message.entity';

export enum ConversationType {
  DIRECT = 'direct',      // 一对一私聊
  GROUP = 'group',        // 群聊
  CHANNEL = 'channel',    // 频道（如招聘频道）
  SUPPORT = 'support'     // 客服支持
}

export enum ConversationCategory {
  JOB_HUNTING = 'job_hunting',     // 求职招聘
  BUSINESS = 'business',           // 商务合作
  SOCIAL = 'social',               // 职场社交
  SUPPORT = 'support'              // 客服支持
}

@Entity('conversations')
@Index(['type', 'updatedAt'])
@Index(['category', 'updatedAt'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DIRECT
  })
  type: ConversationType;

  @Column({
    type: 'enum',
    enum: ConversationCategory,
    default: ConversationCategory.JOB_HUNTING
  })
  category: ConversationCategory;

  // 群聊/频道名称
  @Column({ nullable: true })
  name?: string;

  // 群聊/频道描述
  @Column('text', { nullable: true })
  description?: string;

  // 群聊/频道头像
  @Column({ nullable: true })
  avatar?: string;

  // 参与用户
  @ManyToMany(() => User)
  @JoinTable({
    name: 'conversation_participants',
    joinColumn: { name: 'conversationId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' }
  })
  participants: User[];

  // 对话创建者
  @Column()
  createdById: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  // 群聊管理员
  @ManyToMany(() => User)
  @JoinTable({
    name: 'conversation_admins',
    joinColumn: { name: 'conversationId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' }
  })
  admins: User[];

  // 对话设置
  @Column('jsonb', { default: {} })
  settings: {
    // 权限设置
    canInvite: boolean;
    canSendMessages: boolean;
    canEditMessages: boolean;
    canDeleteMessages: boolean;
    canAddParticipants: boolean;
    canRemoveParticipants: boolean;
    canChangeSettings: boolean;
    
    // 消息设置
    messageHistoryDuration?: number; // 消息保留天数
    allowVoiceMessages: boolean;
    allowVideoMessages: boolean;
    allowFileSharing: boolean;
    maxFileSize?: number;
    allowedFileTypes?: string[];
    
    // 通知设置
    mentionNotifications: boolean;
    messageNotifications: boolean;
    groupActivityNotifications: boolean;
    
    // 隐私设置
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    showReadReceipts: boolean;
    
    // 安全设置
    endToEndEncryption: boolean;
    messageExpiration?: number; // 消息过期时间（小时）
    requireApprovalToJoin: boolean;
  };

  // 关联的业务实体
  @Column({ nullable: true })
  jobId?: string;

  @Column({ nullable: true })
  resumeId?: string;

  @Column({ nullable: true })
  assignmentId?: string;

  // 对话状态
  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ default: false })
  isMuted: boolean;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ nullable: true })
  pinnedAt?: Date;

  @Column({ nullable: true })
  archivedAt?: Date;

  // 最后一条消息信息
  @Column({ nullable: true })
  lastMessageId?: string;

  @Column('text', { nullable: true })
  lastMessagePreview?: string;

  @Column({ nullable: true })
  lastMessageSenderId?: string;

  @Column({ nullable: true })
  lastMessageType?: string;

  @Column({ nullable: true })
  lastMessageCreatedAt?: Date;

  // 未读消息计数
  @Column('jsonb', { default: {} })
  unreadCounts: Record<string, number>; // userId -> unreadCount

  // 统计信息
  @Column({ default: 0 })
  totalMessages: number;

  @Column({ default: 0 })
  totalParticipants: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联的消息
  @OneToMany(() => Message, message => message.conversation)
  messages: Message[];

  // 计算字段（非数据库字段）
  unreadCount?: number;
  lastMessage?: Message;
  otherParticipant?: User; // 一对一聊天时的对方用户
  participantsPreview?: string;

  getDefaultSettings() {
    return {
      // 权限设置
      canInvite: this.type === ConversationType.GROUP,
      canSendMessages: true,
      canEditMessages: true,
      canDeleteMessages: true,
      canAddParticipants: this.type === ConversationType.GROUP,
      canRemoveParticipants: this.type === ConversationType.GROUP,
      canChangeSettings: this.type === ConversationType.GROUP,
      
      // 消息设置
      messageHistoryDuration: 30, // 默认保留30天
      allowVoiceMessages: true,
      allowVideoMessages: true,
      allowFileSharing: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedFileTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      
      // 通知设置
      mentionNotifications: true,
      messageNotifications: true,
      groupActivityNotifications: this.type === ConversationType.GROUP,
      
      // 隐私设置
      showOnlineStatus: this.type === ConversationType.DIRECT,
      showLastSeen: this.type === ConversationType.DIRECT,
      showReadReceipts: true,
      
      // 安全设置
      endToEndEncryption: false,
      messageExpiration: undefined,
      requireApprovalToJoin: this.type === ConversationType.GROUP,
    };
  }

  @BeforeInsert()
  initializeSettings() {
    // 根据对话类型设置默认权限
    if (!this.settings) {
      this.settings = this.getDefaultSettings();
    } else {
      const defaultSettings = this.getDefaultSettings();
      this.settings = { ...defaultSettings, ...this.settings };
    }
  }

  @BeforeInsert()
  initializeUnreadCounts() {
    if (!this.unreadCounts) {
      this.unreadCounts = {};
    }
  }
}
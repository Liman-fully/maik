import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SquareContent } from './square-content.entity';

export enum InteractionType {
  LIKE = 'like',
  BOOKMARK = 'bookmark',
  SHARE = 'share',
  VIEW = 'view',
  COMMENT = 'comment'
}

@Entity('square_interactions')
@Unique(['contentId', 'userId', 'type'])
@Index(['contentId', 'type', 'createdAt'])
@Index(['userId', 'type', 'createdAt'])
export class SquareInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  contentId: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: InteractionType
  })
  type: InteractionType;

  // 评论内容（仅当type为COMMENT时使用）
  @Column('text', { nullable: true })
  comment?: string;

  // 分享信息（仅当type为SHARE时使用）
  @Column('jsonb', { nullable: true })
  shareInfo?: {
    platform: string;
    shareUrl?: string;
    shareText?: string;
  };

  // 浏览信息（仅当type为VIEW时使用）
  @Column('jsonb', { nullable: true })
  viewInfo?: {
    duration: number; // 浏览时长（秒）
    scrollDepth: number; // 滚动深度百分比
    deviceType: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => SquareContent, content => content.id)
  @JoinColumn({ name: 'contentId' })
  content: SquareContent;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;
}
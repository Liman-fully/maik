import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CardTemplate {
  CLASSIC = 'classic',
  MODERN = 'modern',
  MINIMAL = 'minimal',
  CREATIVE = 'creative',
}

@Entity('business_cards')
export class BusinessCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  name: string;

  @Column()
  title: string;

  @Column()
  company: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  wechat?: string;

  @Column({ nullable: true })
  linkedin?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  avatar_url?: string;

  @Column({ nullable: true })
  qr_code_url?: string;

  @Column({
    type: 'enum',
    enum: CardTemplate,
    default: CardTemplate.MODERN,
  })
  template: CardTemplate;

  @Column({ type: 'jsonb', nullable: true })
  style?: {
    primary_color?: string;
    secondary_color?: string;
    font_family?: string;
    background_image?: string;
  };

  @Column({ default: true })
  is_public: boolean;

  @Column({ default: 0 })
  view_count: number;

  @Column({ default: 0 })
  share_count: number;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('card_views')
export class CardView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  card_id: string;

  @ManyToOne(() => BusinessCard)
  @JoinColumn({ name: 'card_id' })
  card: BusinessCard;

  @Column({ nullable: true })
  viewer_id?: string;

  @Column({ nullable: true })
  viewer_ip?: string;

  @Column({ nullable: true })
  source?: string; // qr, link, search, etc.

  @CreateDateColumn()
  created_at: Date;
}

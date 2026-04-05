import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum FavoriteType {
  JOB = 'job',
  TALENT = 'talent',
}

@Entity('favorites')
@Unique(['userId', 'targetId', 'type'])
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  @Index()
  targetId: string;

  @Column({ type: 'enum', enum: FavoriteType })
  @Index()
  type: FavoriteType;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

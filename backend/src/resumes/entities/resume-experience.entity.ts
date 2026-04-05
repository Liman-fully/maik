import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Resume } from './resume.entity';

@Entity('resume_experiences')
export class ResumeExperience {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company: string;

  @Column()
  position: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date?: Date;

  @Column({ default: false })
  is_current: boolean;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'jsonb', nullable: true })
  skills?: string[];

  @Column({ nullable: true })
  industry?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary?: number;

  @Column({ nullable: true })
  salary_currency?: string;

  @Column({ type: 'jsonb', nullable: true })
  achievements?: string[];

  @Column({ type: 'jsonb', nullable: true })
  technologies?: string[];

  @Column({ nullable: true })
  employment_type?: string; // full_time, part_time, contract, internship

  @Column({ type: 'int', nullable: true })
  team_size?: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Resume, (resume) => resume.experiences, {
    onDelete: 'CASCADE',
  })
  resume: Resume;

  @Column()
  resume_id: string;

  @Index()
  @Column({ nullable: true })
  company_index?: string;

  @Index()
  @Column({ nullable: true })
  position_index?: string;

  // 计算属性：工作年限
  get durationMonths(): number {
    const startDate = new Date(this.start_date);
    const endDate = this.end_date ? new Date(this.end_date) : new Date();
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  }

  get durationYears(): number {
    return Math.floor(this.durationMonths / 12);
  }
}
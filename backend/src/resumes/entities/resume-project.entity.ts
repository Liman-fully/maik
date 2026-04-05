import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index } from 'typeorm';
import { Resume } from './resume.entity';

@Entity('resume_projects')
export class ResumeProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  role?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date', nullable: true })
  start_date?: Date;

  @Column({ type: 'date', nullable: true })
  end_date?: Date;

  @Column({ default: false })
  is_current: boolean;

  @Column({ nullable: true })
  company?: string;

  @Column({ nullable: true })
  client?: string;

  @Column({ type: 'jsonb', nullable: true })
  technologies?: string[];

  @Column({ type: 'jsonb', nullable: true })
  responsibilities?: string[];

  @Column({ type: 'jsonb', nullable: true })
  achievements?: string[];

  @Column({ type: 'jsonb', nullable: true })
  team_size?: { min: number; max: number };

  @Column({ nullable: true })
  project_size?: string; // small, medium, large, enterprise

  @Column({ nullable: true })
  industry?: string;

  @Column({ nullable: true })
  project_url?: string;

  @Column({ nullable: true })
  repository_url?: string;

  @Column({ type: 'jsonb', nullable: true })
  links?: Array<{ name: string; url: string }>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Resume, (resume) => resume.projects, {
    onDelete: 'CASCADE',
  })
  resume: Resume;

  @Column()
  resume_id: string;

  @Index()
  @Column()
  name_index: string;

  @Index()
  @Column({ nullable: true })
  role_index?: string;

  // 计算属性：项目时长（月）
  get durationMonths(): number {
    if (!this.start_date) return 0;
    
    const startDate = new Date(this.start_date);
    const endDate = this.end_date ? new Date(this.end_date) : new Date();
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  }

  // 计算属性：是否开源项目
  get isOpenSource(): boolean {
    return !!this.repository_url && this.repository_url.includes('github');
  }

  // 计算属性：项目规模描述
  get sizeDescription(): string {
    switch (this.project_size) {
      case 'small': return '小型项目 (< 3人)';
      case 'medium': return '中型项目 (3-10人)';
      case 'large': return '大型项目 (10-50人)';
      case 'enterprise': return '企业级项目 (> 50人)';
      default: return '未指定';
    }
  }
}
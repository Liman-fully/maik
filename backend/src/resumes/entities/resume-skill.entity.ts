import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index } from 'typeorm';
import { Resume } from './resume.entity';

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

@Entity('resume_skills')
export class ResumeSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: SkillLevel, default: SkillLevel.INTERMEDIATE })
  level: SkillLevel;

  @Column({ default: 0 })
  years_of_experience: number;

  @Column({ nullable: true })
  category?: string;

  @Column({ type: 'boolean', default: false })
  is_certified: boolean;

  @Column({ nullable: true })
  certification_name?: string;

  @Column({ type: 'date', nullable: true })
  certification_date?: Date;

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[];

  @Column({ nullable: true })
  last_used_date?: Date;

  @Column({ default: 0 })
  proficiency_score: number; // 0-100

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Resume, (resume) => resume.skills, {
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
  category_index?: string;

  @Index()
  @Column()
  level_index: SkillLevel;

  // 计算属性：技能熟练度描述
  get proficiencyDescription(): string {
    if (this.proficiency_score >= 90) return '精通';
    if (this.proficiency_score >= 70) return '熟练';
    if (this.proficiency_score >= 50) return '掌握';
    return '了解';
  }

  // 计算属性：是否近期使用过（一年内）
  get isRecentlyUsed(): boolean {
    if (!this.last_used_date) return false;
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    return new Date(this.last_used_date) > oneYearAgo;
  }
}
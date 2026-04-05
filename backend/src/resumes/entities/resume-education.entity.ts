import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Resume } from './resume.entity';

export enum EducationDegree {
  HIGH_SCHOOL = 'high_school',
  ASSOCIATE = 'associate',
  BACHELOR = 'bachelor',
  MASTER = 'master',
  DOCTORATE = 'doctorate',
  CERTIFICATE = 'certificate',
  DIPLOMA = 'diploma',
  OTHER = 'other',
}

@Entity('resume_educations')
export class ResumeEducation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institution: string;

  @Column({ nullable: true })
  degree?: EducationDegree;

  @Column({ nullable: true })
  field_of_study?: string;

  @Column({ type: 'date', nullable: true })
  start_date?: Date;

  @Column({ type: 'date', nullable: true })
  end_date?: Date;

  @Column({ default: false })
  is_current: boolean;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  gpa?: string;

  @Column({ nullable: true })
  gpa_scale?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  courses?: string[];

  @Column({ type: 'jsonb', nullable: true })
  honors?: string[];

  @Column({ type: 'jsonb', nullable: true })
  activities?: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Resume, (resume) => resume.educations, {
    onDelete: 'CASCADE',
  })
  resume: Resume;

  @Column()
  resume_id: string;

  @Index()
  @Column({ nullable: true })
  institution_index?: string;

  @Index()
  @Column({ nullable: true })
  degree_index?: EducationDegree;

  // 计算属性：是否已毕业
  get isGraduated(): boolean {
    return !!this.end_date && !this.is_current;
  }

  // 计算属性：学习年限
  get durationYears(): number {
    if (!this.start_date) return 0;
    
    const startDate = new Date(this.start_date);
    const endDate = this.end_date ? new Date(this.end_date) : new Date();
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
    
    return Math.round(diffYears * 10) / 10;
  }
}
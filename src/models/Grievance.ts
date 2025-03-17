import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

export enum GrievanceStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
  CLOSED = 'closed'
}

export enum GrievancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum GrievanceCategory {
  ACADEMIC = 'academic',
  FINANCIAL = 'financial',
  ADMINISTRATIVE = 'administrative',
  INFRASTRUCTURE = 'infrastructure',
  HARASSMENT = 'harassment',
  EXAMINATION = 'examination',
  OTHER = 'other'
}

@Entity('grievances')
export class Grievance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  subject: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({
    type: 'enum',
    enum: GrievanceCategory,
    default: GrievanceCategory.OTHER
  })
  category: GrievanceCategory;

  @Column({
    type: 'enum',
    enum: GrievanceStatus,
    default: GrievanceStatus.SUBMITTED
  })
  status: GrievanceStatus;

  @Column({
    type: 'enum',
    enum: GrievancePriority,
    default: GrievancePriority.MEDIUM
  })
  priority: GrievancePriority;

  @Column({ type: 'date', nullable: true })
  resolutionDate: Date;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @Column({ type: 'simple-array', nullable: true })
  attachments: string[];  // AWS S3 URLs to attachments

  @Column({ nullable: true })
  assignedTo: string;  // User ID of committee member handling the grievance

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submitterId' })
  submitter: User;

  @Column()
  submitterId: string;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ default: false })
  isAnonymous: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
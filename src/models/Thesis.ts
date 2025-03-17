import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './Student';
import { Faculty } from './Faculty';

export enum ThesisStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  REVISION_NEEDED = 'revision_needed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published'
}

@Entity('theses')
export class Thesis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  abstract: string;

  @Column({ nullable: true })
  documentUrl: string;  // AWS S3 URL to the thesis document

  @Column({
    type: 'enum',
    enum: ThesisStatus,
    default: ThesisStatus.DRAFT
  })
  status: ThesisStatus;

  @Column({ type: 'date', nullable: true })
  submissionDate: Date;

  @Column({ type: 'date', nullable: true })
  approvalDate: Date;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @ManyToOne(() => Faculty)
  @JoinColumn({ name: 'supervisorId' })
  supervisor: Faculty;

  @Column()
  supervisorId: string;

  @Column('simple-array', { nullable: true })
  keywords: string[];

  @Column({ type: 'text', nullable: true })
  reviewFeedback: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
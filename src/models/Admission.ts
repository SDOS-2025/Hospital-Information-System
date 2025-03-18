import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './Student';

export enum AdmissionStatus {
  APPLIED = 'applied',
  DOCUMENT_VERIFICATION = 'document_verification',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEW_COMPLETED = 'interview_completed',
  REJECTED = 'rejected',
  APPROVED = 'approved',
  FEE_PENDING = 'fee_pending',
  ENROLLED = 'enrolled',
  CANCELLED = 'cancelled'
}

@Entity('admissions')
export class Admission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  applicationNumber: string;

  @Column({ nullable: false })
  program: string;

  @Column({ nullable: false })
  department: string;

  @Column({
    type: 'enum',
    enum: AdmissionStatus,
    default: AdmissionStatus.APPLIED
  })
  status: AdmissionStatus;

  @Column({ nullable: true })
  entranceExamScore?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  previousEducationPercentage?: number;

  @Column({ type: 'simple-array', nullable: true })
  documents: string[];  // AWS S3 URLs to uploaded documents

  @Column({ type: 'date', nullable: true })
  interviewDate?: Date;

  @Column({ type: 'text', nullable: true })
  interviewNotes?: string;

  @Column({ type: 'simple-array', nullable: true })
  interviewPanel?: string[];  // Faculty IDs of interviewers

  @Column({ type: 'date', nullable: true })
  approvalDate?: Date;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({ type: 'simple-json', nullable: true })
  personalDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: Date;
    gender: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };

  @Column({ type: 'simple-json', nullable: true })
  educationHistory: {
    institution: string;
    degree: string;
    field: string;
    startDate: Date;
    endDate: Date;
    percentage: number;
  }[];

  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ nullable: true })
  studentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
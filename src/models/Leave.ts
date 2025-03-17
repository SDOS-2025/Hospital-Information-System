import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Faculty } from './Faculty';
import { Student } from './Student';

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export enum LeaveType {
  MEDICAL = 'medical',
  PERSONAL = 'personal',
  EDUCATIONAL = 'educational',
  CASUAL = 'casual',
  EARNED = 'earned',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity'
}

@Entity('leaves')
export class Leave {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: LeaveType,
    nullable: false
  })
  type: LeaveType;

  @Column({ type: 'date', nullable: false })
  startDate: Date;

  @Column({ type: 'date', nullable: false })
  endDate: Date;

  @Column({ type: 'text', nullable: false })
  reason: string;

  @Column({
    type: 'enum',
    enum: LeaveStatus,
    default: LeaveStatus.PENDING
  })
  status: LeaveStatus;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ type: 'simple-array', nullable: true })
  attachments: string[];  // AWS S3 URLs to supporting documents

  @ManyToOne(() => User)
  @JoinColumn({ name: 'applicantId' })
  applicant: User;

  @Column()
  applicantId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User;

  @Column({ nullable: true })
  approvedById: string;

  @Column({ type: 'date', nullable: true })
  approvalDate: Date;

  @Column({ default: false })
  isEmergency: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
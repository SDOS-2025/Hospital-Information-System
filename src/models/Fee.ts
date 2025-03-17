import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './Student';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  WAIVED = 'waived',
  PARTIAL = 'partial'
}

export enum PaymentMethod {
  ONLINE = 'online',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CHECK = 'check',
  SCHOLARSHIP = 'scholarship'
}

@Entity('fees')
export class Fee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  semester: number;

  @Column({ type: 'date', nullable: false })
  dueDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  status: PaymentStatus;

  @Column({ type: 'date', nullable: true })
  paymentDate: Date;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true
  })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  receiptUrl: string;  // AWS S3 URL to receipt document

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @Column({ nullable: false })
  feeType: string;  // tuition, hostel, examination, etc.

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  lateFee: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
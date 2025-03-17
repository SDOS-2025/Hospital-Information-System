import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Faculty } from './Faculty';

export enum ExamType {
  INTERNAL = 'internal',
  MIDTERM = 'midterm',
  FAT = 'fat',  // Final Assessment Test
  PRACTICAL = 'practical',
  VIVA = 'viva'
}

export enum ExamStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed'
}

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false })
  courseCode: string;

  @Column({ nullable: false })
  semester: number;

  @Column({
    type: 'enum',
    enum: ExamType,
    nullable: false
  })
  type: ExamType;

  @Column({ type: 'timestamp', nullable: false })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: false })
  endTime: Date;

  @Column({ nullable: false })
  venue: string;

  @Column({ nullable: true })
  maxMarks: number;

  @Column({ nullable: true })
  passingMarks: number;

  @Column({
    type: 'enum',
    enum: ExamStatus,
    default: ExamStatus.SCHEDULED
  })
  status: ExamStatus;

  @Column({ nullable: true })
  instructions: string;

  @ManyToOne(() => Faculty)
  @JoinColumn({ name: 'facultyInChargeId' })
  facultyInCharge: Faculty;

  @Column()
  facultyInChargeId: string;

  @Column({ type: 'simple-array', nullable: true })
  proctors: string[]; // Faculty IDs assigned as proctors

  @Column({ type: 'simple-array', nullable: true })
  attachments: string[]; // AWS S3 URLs for question papers, etc.

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
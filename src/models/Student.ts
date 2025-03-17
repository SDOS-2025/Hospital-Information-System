import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  registrationNumber: string;

  @Column({ nullable: false })
  batch: string;

  @Column({ nullable: false })
  program: string;

  @Column({ nullable: false })
  department: string;

  @Column({ nullable: true })
  semester: number;

  @Column({ nullable: true })
  enrollmentDate: Date;

  @Column({ nullable: true })
  graduationDate: Date;

  @Column({ default: 'active' })
  academicStatus: string; // active, graduated, suspended, withdrawn

  @Column({ nullable: true })
  cgpa: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
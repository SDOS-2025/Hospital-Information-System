import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('faculty')
export class Faculty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  employeeId: string;

  @Column({ nullable: false })
  department: string;

  @Column({ nullable: false })
  designation: string;  // Professor, Associate Professor, Assistant Professor, etc.

  @Column({ nullable: false })
  specialization: string;

  @Column({ nullable: true })
  qualifications: string;

  @Column({ type: 'date', nullable: true })
  joiningDate: Date;

  @Column({ nullable: true })
  experience: number;  // in years

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
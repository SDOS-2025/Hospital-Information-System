import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm"; // Added OneToMany
import { User } from "./User";
import { Exam } from "./Exam"; // Import the Exam entity

@Entity("faculty")
export class Faculty {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, nullable: false })
  employeeId: string;

  @Column({ nullable: false })
  department: string;

  @Column({ nullable: false })
  designation: string; // Professor, Associate Professor, Assistant Professor, etc.

  @Column({ nullable: false })
  specialization: string;

  @Column({ nullable: true })
  qualifications: string;

  @Column({ type: "date", nullable: true })
  joiningDate: Date;

  @Column({ nullable: true })
  experience: number; // in years

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => Exam, (exam) => exam.facultyInCharge)
  exams: Exam[];
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

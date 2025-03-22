import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  FAILED_LOGIN = 'failed_login',
  EXPORT = 'export',
  IMPORT = 'import',
  APPROVE = 'approve',
  REJECT = 'reject',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  OTHER = 'other'
}

export enum AuditResource {
  USER = 'user',
  STUDENT = 'student',
  FACULTY = 'faculty',
  THESIS = 'thesis',
  FEE = 'fee',
  ADMISSION = 'admission',
  GRIEVANCE = 'grievance',
  LEAVE = 'leave',
  EXAM = 'exam',
  SYSTEM = 'system',
  OTHER = 'other'
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
    default: AuditAction.OTHER
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditResource,
    default: AuditResource.OTHER
  })
  resource: AuditResource;

  @Column({ nullable: true })
  resourceId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  details: object;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: false })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
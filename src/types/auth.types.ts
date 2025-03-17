import { Request } from 'express';

export enum UserRole {
  ADMIN = 'admin',
  FACULTY = 'faculty',
  STUDENT = 'student',
  GRIEVANCE_COMMITTEE = 'grievance_committee',
  STAFF = 'staff'
}

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}
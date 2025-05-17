// Common types
export interface BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  username: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
}

export interface Student extends BaseEntity {
  name: string;
  email: string;
  enrollmentNumber: string;
  department: string;
  semester: number;
  program: string;
}

export interface Faculty extends BaseEntity {
  name: string;
  email: string;
  employeeId: string;
  department: string;
  designation: string;
  specialization: string;
}

export interface Admission extends BaseEntity {
  student: Student;
  program: string;
  status: 'pending' | 'approved' | 'rejected';
  applicationDate: Date;
  documents: string[];
}

export enum ExamType {
  INTERNAL = 'internal',
  MIDTERM = 'midterm',
  FAT = 'fat',
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

export interface Exam extends BaseEntity {
  title: string;
  courseCode: string;
  semester: number;
  type: ExamType;
  startTime: Date;
  endTime: Date;
  venue: string;
  maxMarks?: number;
  passingMarks?: number;
  status: ExamStatus;
  instructions?: string;
  facultyInCharge: Faculty;
  facultyInChargeId: string;
  proctors?: string[];
  attachments?: string[];
  remarks?: string;
}

export interface Fee extends BaseEntity {
  student: Student;
  amount: number;
  type: string;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue';
  transactionId?: string;
}

export interface Grievance extends BaseEntity {
  student: Student;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
}

export interface Leave extends BaseEntity {
  user: User;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  type: string;
}

export interface Thesis extends BaseEntity {
  student: Student;
  title: string;
  supervisor: Faculty;
  status: 'in-progress' | 'submitted' | 'reviewed' | 'approved';
  submissionDate?: Date;
  document?: string;
}
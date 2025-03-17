import { Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { Student } from '../models/Student';
import { User } from '../models/User';
import { UserRole } from '../types/auth.types';
import { sendWelcomeEmail } from '../utils/email.util';

export class StudentService {
  private studentRepository: Repository<Student>;
  private userRepository: Repository<User>;

  constructor() {
    this.studentRepository = AppDataSource.getRepository(Student);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Register a new student with user account
   */
  async registerStudent(studentData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    registrationNumber: string;
    batch: string;
    program: string;
    department: string;
    semester?: number;
    enrollmentDate?: Date;
    contactNumber?: string;
  }): Promise<Student> {
    const { 
      firstName, 
      lastName, 
      email, 
      password,
      registrationNumber,
      batch,
      program,
      department,
      semester,
      enrollmentDate,
      contactNumber
    } = studentData;

    // Check if registration number already exists
    const existingStudent = await this.studentRepository.findOne({
      where: { registrationNumber }
    });

    if (existingStudent) {
      throw new Error('Student with this registration number already exists');
    }

    // Create user account
    const user = this.userRepository.create({
      firstName,
      lastName,
      email,
      password,
      role: UserRole.STUDENT,
      contactNumber,
      isActive: true
    });

    await this.userRepository.save(user);

    // Create student profile
    const student = this.studentRepository.create({
      registrationNumber,
      batch,
      program,
      department,
      semester,
      enrollmentDate: enrollmentDate || new Date(),
      academicStatus: 'active',
      userId: user.id
    });

    await this.studentRepository.save(student);

    // Send welcome email
    await sendWelcomeEmail(
      `${user.firstName} ${user.lastName}`,
      user.email,
      'Student'
    );

    return student;
  }

  /**
   * Get all students
   */
  async getAllStudents(filters?: {
    batch?: string;
    department?: string;
    program?: string;
    academicStatus?: string;
  }): Promise<Student[]> {
    const query = this.studentRepository.createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user');

    if (filters) {
      if (filters.batch) {
        query.andWhere('student.batch = :batch', { batch: filters.batch });
      }
      if (filters.department) {
        query.andWhere('student.department = :department', { department: filters.department });
      }
      if (filters.program) {
        query.andWhere('student.program = :program', { program: filters.program });
      }
      if (filters.academicStatus) {
        query.andWhere('student.academicStatus = :academicStatus', { academicStatus: filters.academicStatus });
      }
    }

    return query.getMany();
  }

  /**
   * Get student by ID
   */
  async getStudentById(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!student) {
      throw new Error('Student not found');
    }

    return student;
  }

  /**
   * Get student by registration number
   */
  async getStudentByRegistrationNumber(registrationNumber: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { registrationNumber },
      relations: ['user']
    });

    if (!student) {
      throw new Error('Student not found');
    }

    return student;
  }

  /**
   * Update student information
   */
  async updateStudent(id: string, updateData: {
    batch?: string;
    program?: string;
    department?: string;
    semester?: number;
    academicStatus?: string;
    cgpa?: number;
    graduationDate?: Date;
    firstName?: string;
    lastName?: string;
    contactNumber?: string;
    profilePicture?: string;
  }): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Extract user data and student data
    const {
      firstName,
      lastName,
      contactNumber,
      profilePicture,
      ...studentData
    } = updateData;

    // Update student data
    Object.assign(student, studentData);
    await this.studentRepository.save(student);

    // If user data is provided, update user
    if (firstName || lastName || contactNumber || profilePicture) {
      const user = await this.userRepository.findOneBy({ id: student.userId });
      if (user) {
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (contactNumber) user.contactNumber = contactNumber;
        if (profilePicture) user.profilePicture = profilePicture;

        await this.userRepository.save(user);
      }
    }

    return this.getStudentById(id);
  }

  /**
   * Delete student
   */
  async deleteStudent(id: string): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { id }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // First delete student
    await this.studentRepository.remove(student);

    // Then delete user account
    const user = await this.userRepository.findOneBy({ id: student.userId });
    if (user) {
      await this.userRepository.remove(user);
    }
  }
}
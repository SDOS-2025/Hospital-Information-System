import { Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { Faculty } from '../models/Faculty';
import { User } from '../models/User';
import { UserRole } from '../types/auth.types';
import { sendWelcomeEmail } from '../utils/email.util';

export class FacultyService {
  private facultyRepository: Repository<Faculty>;
  private userRepository: Repository<User>;

  constructor() {
    this.facultyRepository = AppDataSource.getRepository(Faculty);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Register a new faculty member with user account
   */
  async registerFaculty(facultyData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    employeeId: string;
    department: string;
    designation: string;
    specialization: string;
    qualifications?: string;
    joiningDate?: Date;
    experience?: number;
    contactNumber?: string;
  }): Promise<Faculty> {
    const {
      firstName,
      lastName,
      email,
      password,
      employeeId,
      department,
      designation,
      specialization,
      qualifications,
      joiningDate,
      experience,
      contactNumber
    } = facultyData;

    // Check if employee ID already exists
    const existingFaculty = await this.facultyRepository.findOne({
      where: { employeeId }
    });

    if (existingFaculty) {
      throw new Error('Faculty with this employee ID already exists');
    }

    // Create user account
    const user = this.userRepository.create({
      firstName,
      lastName,
      email,
      password,
      role: UserRole.FACULTY,
      contactNumber,
      isActive: true
    });

    await this.userRepository.save(user);

    // Create faculty profile
    const faculty = this.facultyRepository.create({
      employeeId,
      department,
      designation,
      specialization,
      qualifications,
      joiningDate: joiningDate || new Date(),
      experience,
      userId: user.id
    });

    await this.facultyRepository.save(faculty);

    // Send welcome email
    await sendWelcomeEmail(
      `${user.firstName} ${user.lastName}`,
      user.email,
      'Faculty'
    );

    return this.getFacultyById(faculty.id);
  }

  /**
   * Get all faculty members
   */
  async getAllFaculty(filters?: {
    department?: string;
    designation?: string;
    specialization?: string;
  }): Promise<Faculty[]> {
    const query = this.facultyRepository.createQueryBuilder('faculty')
      .leftJoinAndSelect('faculty.user', 'user');

    if (filters) {
      if (filters.department) {
        query.andWhere('faculty.department = :department', { department: filters.department });
      }
      if (filters.designation) {
        query.andWhere('faculty.designation = :designation', { designation: filters.designation });
      }
      if (filters.specialization) {
        query.andWhere('faculty.specialization = :specialization', { specialization: filters.specialization });
      }
    }

    return query.getMany();
  }

  /**
   * Get faculty by ID
   */
  async getFacultyById(id: string): Promise<Faculty> {
    const faculty = await this.facultyRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!faculty) {
      throw new Error('Faculty not found');
    }

    return faculty;
  }

  /**
   * Get faculty by employee ID
   */
  async getFacultyByEmployeeId(employeeId: string): Promise<Faculty> {
    const faculty = await this.facultyRepository.findOne({
      where: { employeeId },
      relations: ['user']
    });

    if (!faculty) {
      throw new Error('Faculty not found');
    }

    return faculty;
  }

  /**
   * Update faculty information
   */
  async updateFaculty(id: string, updateData: {
    department?: string;
    designation?: string;
    specialization?: string;
    qualifications?: string;
    experience?: number;
    firstName?: string;
    lastName?: string;
    contactNumber?: string;
    profilePicture?: string;
  }): Promise<Faculty> {
    const faculty = await this.facultyRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!faculty) {
      throw new Error('Faculty not found');
    }

    // Extract user data and faculty data
    const {
      firstName,
      lastName,
      contactNumber,
      profilePicture,
      ...facultyData
    } = updateData;

    // Update faculty data
    Object.assign(faculty, facultyData);
    await this.facultyRepository.save(faculty);

    // If user data is provided, update user
    if (firstName || lastName || contactNumber || profilePicture) {
      const user = await this.userRepository.findOneBy({ id: faculty.userId });
      if (user) {
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (contactNumber) user.contactNumber = contactNumber;
        if (profilePicture) user.profilePicture = profilePicture;

        await this.userRepository.save(user);
      }
    }

    return this.getFacultyById(id);
  }

  /**
   * Delete faculty
   */
  async deleteFaculty(id: string): Promise<void> {
    const faculty = await this.facultyRepository.findOne({
      where: { id }
    });

    if (!faculty) {
      throw new Error('Faculty not found');
    }

    // First delete faculty
    await this.facultyRepository.remove(faculty);

    // Then delete user account
    const user = await this.userRepository.findOneBy({ id: faculty.userId });
    if (user) {
      await this.userRepository.remove(user);
    }
  }

  /**
   * Get faculty teaching load
   */
  async getFacultyTeachingLoad(facultyId: string): Promise<number> {
    const faculty = await this.facultyRepository.findOne({
      where: { id: facultyId },
      relations: ['exams']
    });

    if (!faculty) {
      throw new Error('Faculty not found');
    }

    // Calculate teaching load based on assigned exams
    // This is a simple implementation - you might want to make it more sophisticated
    return faculty.exams ? faculty.exams.length : 0;
  }
}
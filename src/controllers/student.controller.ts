import { Request, Response } from 'express';
import { StudentService } from '../services/student.service';
import { AuthRequest } from '../types/auth.types';

export class StudentController {
  private studentService: StudentService;

  constructor() {
    this.studentService = new StudentService();
  }

  /**
   * Register a new student
   */
  registerStudent = async (req: Request, res: Response): Promise<Response> => {
    try {
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
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !password || !registrationNumber || !batch || !program || !department) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide all required fields'
        });
      }

      const student = await this.studentService.registerStudent({
        firstName,
        lastName,
        email,
        password,
        registrationNumber,
        batch,
        program,
        department,
        semester,
        enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : undefined,
        contactNumber
      });

      return res.status(201).json({
        status: 'success',
        message: 'Student registered successfully',
        data: {
          id: student.id,
          registrationNumber: student.registrationNumber,
          user: {
            id: student.user.id,
            firstName: student.user.firstName,
            lastName: student.user.lastName,
            email: student.user.email
          },
          batch: student.batch,
          program: student.program,
          department: student.department,
          semester: student.semester,
          academicStatus: student.academicStatus
        }
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to register student'
      });
    }
  };

  /**
   * Get all students
   */
  getAllStudents = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { batch, department, program, academicStatus } = req.query;
      
      const filters = {
        batch: batch as string,
        department: department as string,
        program: program as string,
        academicStatus: academicStatus as string
      };

      const students = await this.studentService.getAllStudents(filters);

      return res.status(200).json({
        status: 'success',
        message: 'Students retrieved successfully',
        results: students.length,
        data: students
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve students'
      });
    }
  };

  /**
   * Get student by ID
   */
  getStudentById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const student = await this.studentService.getStudentById(id);

      return res.status(200).json({
        status: 'success',
        message: 'Student retrieved successfully',
        data: student
      });
    } catch (error) {
      return res.status(404).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Student not found'
      });
    }
  };

  /**
   * Get student by registration number
   */
  getStudentByRegistrationNumber = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { registrationNumber } = req.params;
      const student = await this.studentService.getStudentByRegistrationNumber(registrationNumber);

      return res.status(200).json({
        status: 'success',
        message: 'Student retrieved successfully',
        data: student
      });
    } catch (error) {
      return res.status(404).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Student not found'
      });
    }
  };

  /**
   * Update student information
   */
  updateStudent = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedStudent = await this.studentService.updateStudent(id, updateData);

      return res.status(200).json({
        status: 'success',
        message: 'Student updated successfully',
        data: updatedStudent
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to update student'
      });
    }
  };

  /**
   * Delete student
   */
  deleteStudent = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      await this.studentService.deleteStudent(id);

      return res.status(200).json({
        status: 'success',
        message: 'Student deleted successfully'
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete student'
      });
    }
  };

  /**
   * Get student profile (for current logged-in student)
   */
  getMyProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      // Find student record associated with the logged-in user
      const students = await this.studentService.getAllStudents();
      const myProfile = students.find(student => student.userId === req.user!.id);
      
      if (!myProfile) {
        return res.status(404).json({
          status: 'error',
          message: 'Student profile not found'
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Profile retrieved successfully',
        data: myProfile
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve profile'
      });
    }
  };
}
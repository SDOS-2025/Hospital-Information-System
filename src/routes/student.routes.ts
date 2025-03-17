import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/auth.types';

const studentController = new StudentController();
const router = Router();

/**
 * @route   POST /api/v1/students
 * @desc    Register a new student
 * @access  Admin only
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  studentController.registerStudent
);

/**
 * @route   GET /api/v1/students
 * @desc    Get all students with optional filtering
 * @access  Admin and Faculty
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.FACULTY),
  studentController.getAllStudents
);

/**
 * @route   GET /api/v1/students/profile
 * @desc    Get own student profile
 * @access  Authenticated student
 */
router.get(
  '/profile',
  authenticate,
  studentController.getMyProfile
);

/**
 * @route   GET /api/v1/students/:id
 * @desc    Get student by ID
 * @access  Admin and Faculty
 */
router.get(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.FACULTY),
  studentController.getStudentById
);

/**
 * @route   GET /api/v1/students/registration/:registrationNumber
 * @desc    Get student by registration number
 * @access  Admin and Faculty
 */
router.get(
  '/registration/:registrationNumber',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.FACULTY),
  studentController.getStudentByRegistrationNumber
);

/**
 * @route   PUT /api/v1/students/:id
 * @desc    Update student information
 * @access  Admin only
 */
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  studentController.updateStudent
);

/**
 * @route   DELETE /api/v1/students/:id
 * @desc    Delete student
 * @access  Admin only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  studentController.deleteStudent
);

export default router;
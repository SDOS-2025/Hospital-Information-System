import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/auth.types';
import { AuditResource } from '../models/AuditLog';
import { createAuditedRouter } from '../utils/audit-routes.util';
import { RequestHandler } from 'express';

const studentController = new StudentController();
const router = createAuditedRouter(AuditResource.STUDENT);

// Convert controller methods to RequestHandler type with proper async handling
const registerStudent: RequestHandler = async (req, res, next) => {
  await studentController.registerStudent(req, res);
};

const getAllStudents: RequestHandler = async (req, res, next) => {
  await studentController.getAllStudents(req, res);
};

const getMyProfile: RequestHandler = async (req, res, next) => {
  await studentController.getMyProfile(req, res);
};

const getStudentById: RequestHandler = async (req, res, next) => {
  await studentController.getStudentById(req, res);
};

const getStudentByRegistrationNumber: RequestHandler = async (req, res, next) => {
  await studentController.getStudentByRegistrationNumber(req, res);
};

const updateStudent: RequestHandler = async (req, res, next) => {
  await studentController.updateStudent(req, res);
};

const deleteStudent: RequestHandler = async (req, res, next) => {
  await studentController.deleteStudent(req, res);
};

/**
 * @route   POST /api/v1/students
 * @desc    Register a new student
 * @access  Admin only
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  registerStudent
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
  getAllStudents
);

/**
 * @route   GET /api/v1/students/profile
 * @desc    Get own student profile
 * @access  Authenticated student
 */
router.get(
  '/profile',
  authenticate,
  getMyProfile
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
  getStudentById
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
  getStudentByRegistrationNumber
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
  updateStudent
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
  deleteStudent
);

export default router;
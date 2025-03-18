import { Router } from 'express';
import { FacultyController } from '../controllers/faculty.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/auth.types';

const facultyController = new FacultyController();
const router = Router();

/**
 * @route   POST /api/v1/faculty
 * @desc    Register a new faculty member
 * @access  Admin only
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  facultyController.registerFaculty
);

/**
 * @route   GET /api/v1/faculty
 * @desc    Get all faculty with optional filtering
 * @access  Admin and Faculty
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.FACULTY),
  facultyController.getAllFaculty
);

/**
 * @route   GET /api/v1/faculty/profile
 * @desc    Get own faculty profile
 * @access  Authenticated faculty
 */
router.get(
  '/profile',
  authenticate,
  authorize(UserRole.FACULTY),
  facultyController.getMyProfile
);

/**
 * @route   GET /api/v1/faculty/:id
 * @desc    Get faculty by ID
 * @access  Admin and Faculty
 */
router.get(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.FACULTY),
  facultyController.getFacultyById
);

/**
 * @route   GET /api/v1/faculty/employee/:employeeId
 * @desc    Get faculty by employee ID
 * @access  Admin and Faculty
 */
router.get(
  '/employee/:employeeId',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.FACULTY),
  facultyController.getFacultyByEmployeeId
);

/**
 * @route   PUT /api/v1/faculty/:id
 * @desc    Update faculty information
 * @access  Admin only
 */
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  facultyController.updateFaculty
);

/**
 * @route   DELETE /api/v1/faculty/:id
 * @desc    Delete faculty
 * @access  Admin only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  facultyController.deleteFaculty
);

/**
 * @route   GET /api/v1/faculty/:id/teaching-load
 * @desc    Get faculty teaching load
 * @access  Admin and Faculty
 */
router.get(
  '/:id/teaching-load',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.FACULTY),
  facultyController.getTeachingLoad
);

export default router;
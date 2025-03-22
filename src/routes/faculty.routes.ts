import { Router } from 'express';
import { FacultyController } from '../controllers/faculty.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/auth.types';
import { AuditResource } from '../models/AuditLog';
import { createAuditedRouter } from '../utils/audit-routes.util';
import { RequestHandler } from 'express';

const facultyController = new FacultyController();
const router = createAuditedRouter(AuditResource.FACULTY);

// Convert controller methods to RequestHandler type with proper async handling
const registerFaculty: RequestHandler = async (req, res, next) => {
  await facultyController.registerFaculty(req, res);
};

const getAllFaculty: RequestHandler = async (req, res, next) => {
  await facultyController.getAllFaculty(req, res);
};

const getMyProfile: RequestHandler = async (req, res, next) => {
  await facultyController.getMyProfile(req, res);
};

const getFacultyById: RequestHandler = async (req, res, next) => {
  await facultyController.getFacultyById(req, res);
};

const getFacultyByEmployeeId: RequestHandler = async (req, res, next) => {
  await facultyController.getFacultyByEmployeeId(req, res);
};

const updateFaculty: RequestHandler = async (req, res, next) => {
  await facultyController.updateFaculty(req, res);
};

const deleteFaculty: RequestHandler = async (req, res, next) => {
  await facultyController.deleteFaculty(req, res);
};

const getTeachingLoad: RequestHandler = async (req, res, next) => {
  await facultyController.getTeachingLoad(req, res);
};

/**
 * @route   POST /api/v1/faculty
 * @desc    Register a new faculty member
 * @access  Admin only
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  registerFaculty
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
  getAllFaculty
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
  getMyProfile
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
  getFacultyById
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
  getFacultyByEmployeeId
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
  updateFaculty
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
  deleteFaculty
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
  getTeachingLoad
);

export default router;
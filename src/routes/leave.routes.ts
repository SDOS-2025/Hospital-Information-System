import { Router } from 'express';
import { LeaveController } from '../controllers/leave.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/auth.types';
import { AuditResource } from '../models/AuditLog';
import { createAuditedRouter } from '../utils/audit-routes.util';
import { RequestHandler } from 'express';

const leaveController = new LeaveController();
const router = createAuditedRouter(AuditResource.LEAVE);

// Convert controller methods to RequestHandler type with proper async handling
const applyLeave: RequestHandler = async (req, res, next) => {
  await leaveController.applyLeave(req, res);
};

const uploadDocuments: RequestHandler = async (req, res, next) => {
  await leaveController.uploadDocuments(req, res);
};

const getAllLeaves: RequestHandler = async (req, res, next) => {
  await leaveController.getAllLeaves(req, res);
};

const getMyLeaves: RequestHandler = async (req, res, next) => {
  await leaveController.getMyLeaves(req, res);
};

const getLeaveById: RequestHandler = async (req, res, next) => {
  await leaveController.getLeaveById(req, res);
};

const updateLeaveStatus: RequestHandler = async (req, res, next) => {
  await leaveController.updateLeaveStatus(req, res);
};

const cancelLeave: RequestHandler = async (req, res, next) => {
  await leaveController.cancelLeave(req, res);
};

const getLeaveStatistics: RequestHandler = async (req, res, next) => {
  await leaveController.getLeaveStatistics(req, res);
};

/**
 * @route   POST /api/v1/leaves
 * @desc    Apply for leave
 * @access  All authenticated users
 */
router.post(
  '/',
  authenticate,
  applyLeave
);

/**
 * @route   POST /api/v1/leaves/:id/documents
 * @desc    Upload supporting documents for leave
 * @access  Owner of leave application
 */
router.post(
  '/:id/documents',
  authenticate,
  uploadDocuments
);

/**
 * @route   GET /api/v1/leaves
 * @desc    Get all leaves with optional filtering
 * @access  Admin and authorized staff
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.FACULTY),
  getAllLeaves
);

/**
 * @route   GET /api/v1/leaves/my
 * @desc    Get leaves for current user
 * @access  All authenticated users
 */
router.get(
  '/my',
  authenticate,
  getMyLeaves
);

/**
 * @route   GET /api/v1/leaves/:id
 * @desc    Get leave by ID
 * @access  Admin, authorized staff, and leave owner
 */
router.get(
  '/:id',
  authenticate,
  getLeaveById
);

/**
 * @route   PATCH /api/v1/leaves/:id/status
 * @desc    Update leave status
 * @access  Admin and authorized staff
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.FACULTY),
  updateLeaveStatus
);

/**
 * @route   DELETE /api/v1/leaves/:id
 * @desc    Cancel leave application
 * @access  Owner of leave application
 */
router.delete(
  '/:id',
  authenticate,
  cancelLeave
);

/**
 * @route   GET /api/v1/leaves/statistics
 * @desc    Get leave statistics for current user
 * @access  All authenticated users
 */
router.get(
  '/statistics',
  authenticate,
  getLeaveStatistics
);

export default router;
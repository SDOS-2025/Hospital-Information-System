import { Router } from 'express';
import { LeaveController } from '../controllers/leave.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/auth.types';

const leaveController = new LeaveController();
const router = Router();

/**
 * @route   POST /api/v1/leaves
 * @desc    Apply for leave
 * @access  All authenticated users
 */
router.post(
  '/',
  authenticate,
  leaveController.applyLeave
);

/**
 * @route   POST /api/v1/leaves/:id/documents
 * @desc    Upload supporting documents for leave
 * @access  Owner of leave application
 */
router.post(
  '/:id/documents',
  authenticate,
  leaveController.uploadDocuments
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
  leaveController.getAllLeaves
);

/**
 * @route   GET /api/v1/leaves/my
 * @desc    Get leaves for current user
 * @access  All authenticated users
 */
router.get(
  '/my',
  authenticate,
  leaveController.getMyLeaves
);

/**
 * @route   GET /api/v1/leaves/:id
 * @desc    Get leave by ID
 * @access  Admin, authorized staff, and leave owner
 */
router.get(
  '/:id',
  authenticate,
  leaveController.getLeaveById
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
  leaveController.updateLeaveStatus
);

/**
 * @route   DELETE /api/v1/leaves/:id
 * @desc    Cancel leave application
 * @access  Owner of leave application
 */
router.delete(
  '/:id',
  authenticate,
  leaveController.cancelLeave
);

/**
 * @route   GET /api/v1/leaves/statistics
 * @desc    Get leave statistics for current user
 * @access  All authenticated users
 */
router.get(
  '/statistics',
  authenticate,
  leaveController.getLeaveStatistics
);

export default router;
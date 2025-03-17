import { Router } from 'express';
import { GrievanceController } from '../controllers/grievance.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/auth.types';

const grievanceController = new GrievanceController();
const router = Router();

/**
 * @route   POST /api/v1/grievances
 * @desc    Submit a new grievance
 * @access  Authenticated users
 */
router.post(
  '/',
  authenticate,
  grievanceController.submitGrievance
);

/**
 * @route   POST /api/v1/grievances/:id/attachments
 * @desc    Upload attachments for a grievance
 * @access  Authenticated users
 */
router.post(
  '/:id/attachments',
  authenticate,
  grievanceController.uploadAttachments
);

/**
 * @route   GET /api/v1/grievances
 * @desc    Get all grievances with optional filtering
 * @access  Admin and Committee members
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  grievanceController.getAllGrievances
);

/**
 * @route   GET /api/v1/grievances/my
 * @desc    Get grievances submitted by the current user
 * @access  Authenticated users
 */
router.get(
  '/my',
  authenticate,
  grievanceController.getMyGrievances
);

/**
 * @route   GET /api/v1/grievances/assigned
 * @desc    Get grievances assigned to the current user
 * @access  Staff and Committee members
 */
router.get(
  '/assigned',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  grievanceController.getAssignedGrievances
);

/**
 * @route   GET /api/v1/grievances/:id
 * @desc    Get grievance by ID
 * @access  Admin, Committee, original submitter, and assigned staff
 */
router.get(
  '/:id',
  authenticate,
  grievanceController.getGrievanceById
);

/**
 * @route   PUT /api/v1/grievances/:id
 * @desc    Update grievance details
 * @access  Original submitter and Committee members
 */
router.put(
  '/:id',
  authenticate,
  grievanceController.updateGrievance
);

/**
 * @route   PATCH /api/v1/grievances/:id/status
 * @desc    Update grievance status
 * @access  Admin and Committee members
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  grievanceController.updateStatus
);

/**
 * @route   POST /api/v1/grievances/:id/resolution
 * @desc    Add resolution to a grievance
 * @access  Admin and Committee members
 */
router.post(
  '/:id/resolution',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  grievanceController.addResolution
);

/**
 * @route   DELETE /api/v1/grievances/:id
 * @desc    Delete a grievance
 * @access  Original submitter or Admin
 */
router.delete(
  '/:id',
  authenticate,
  grievanceController.deleteGrievance
);

export default router;
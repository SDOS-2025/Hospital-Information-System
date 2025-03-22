import { Router } from 'express';
import { GrievanceController } from '../controllers/grievance.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/auth.types';
import { AuditResource } from '../models/AuditLog';
import { createAuditedRouter } from '../utils/audit-routes.util';
import { RequestHandler } from 'express';

const grievanceController = new GrievanceController();
const router = createAuditedRouter(AuditResource.GRIEVANCE);

// Convert controller methods to RequestHandler type with proper async handling
const submitGrievance: RequestHandler = async (req, res, next) => {
  await grievanceController.submitGrievance(req, res);
};

const uploadAttachments: RequestHandler = async (req, res, next) => {
  await grievanceController.uploadAttachments(req, res);
};

const getAllGrievances: RequestHandler = async (req, res, next) => {
  await grievanceController.getAllGrievances(req, res);
};

const getMyGrievances: RequestHandler = async (req, res, next) => {
  await grievanceController.getMyGrievances(req, res);
};

const getAssignedGrievances: RequestHandler = async (req, res, next) => {
  await grievanceController.getAssignedGrievances(req, res);
};

const getGrievanceById: RequestHandler = async (req, res, next) => {
  await grievanceController.getGrievanceById(req, res);
};

const updateGrievance: RequestHandler = async (req, res, next) => {
  await grievanceController.updateGrievance(req, res);
};

const updateStatus: RequestHandler = async (req, res, next) => {
  await grievanceController.updateStatus(req, res);
};

const addResolution: RequestHandler = async (req, res, next) => {
  await grievanceController.addResolution(req, res);
};

const deleteGrievance: RequestHandler = async (req, res, next) => {
  await grievanceController.deleteGrievance(req, res);
};

/**
 * @route   POST /api/v1/grievances
 * @desc    Submit a new grievance
 * @access  Authenticated users
 */
router.post(
  '/',
  authenticate,
  submitGrievance
);

/**
 * @route   POST /api/v1/grievances/:id/attachments
 * @desc    Upload attachments for a grievance
 * @access  Authenticated users
 */
router.post(
  '/:id/attachments',
  authenticate,
  uploadAttachments
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
  getAllGrievances
);

/**
 * @route   GET /api/v1/grievances/my
 * @desc    Get grievances submitted by the current user
 * @access  Authenticated users
 */
router.get(
  '/my',
  authenticate,
  getMyGrievances
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
  getAssignedGrievances
);

/**
 * @route   GET /api/v1/grievances/:id
 * @desc    Get grievance by ID
 * @access  Admin, Committee, original submitter, and assigned staff
 */
router.get(
  '/:id',
  authenticate,
  getGrievanceById
);

/**
 * @route   PUT /api/v1/grievances/:id
 * @desc    Update grievance details
 * @access  Original submitter and Committee members
 */
router.put(
  '/:id',
  authenticate,
  updateGrievance
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
  updateStatus
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
  addResolution
);

/**
 * @route   DELETE /api/v1/grievances/:id
 * @desc    Delete a grievance
 * @access  Original submitter or Admin
 */
router.delete(
  '/:id',
  authenticate,
  deleteGrievance
);

export default router;
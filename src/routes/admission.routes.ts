import { Router } from 'express';
import { AdmissionController } from '../controllers/admission.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/auth.types';
import { AuditResource } from '../models/AuditLog';
import { createAuditedRouter } from '../utils/audit-routes.util';
import { RequestHandler } from 'express';

const admissionController = new AdmissionController();
const router = createAuditedRouter(AuditResource.ADMISSION);

// Convert controller methods to RequestHandler type with proper async handling
const submitApplication: RequestHandler = async (req, res, next) => {
  await admissionController.submitApplication(req, res);
};

const uploadDocuments: RequestHandler = async (req, res, next) => {
  await admissionController.uploadDocuments(req, res);
};

const getAllAdmissions: RequestHandler = async (req, res, next) => {
  await admissionController.getAllAdmissions(req, res);
};

const getAdmissionById: RequestHandler = async (req, res, next) => {
  await admissionController.getAdmissionById(req, res);
};

const updateAdmission: RequestHandler = async (req, res, next) => {
  await admissionController.updateAdmission(req, res);
};

const cancelAdmission: RequestHandler = async (req, res, next) => {
  await admissionController.cancelAdmission(req, res);
};

/**
 * @route   POST /api/v1/admissions
 * @desc    Apply for admission
 * @access  Public
 */
router.post(
  '/',
  submitApplication
);

/**
 * @route   POST /api/v1/admissions/:id/documents
 * @desc    Upload supporting documents for admission
 * @access  Public with application ID
 */
router.post(
  '/:id/documents',
  uploadDocuments
);

/**
 * @route   GET /api/v1/admissions
 * @desc    Get all admission applications with optional filtering
 * @access  Admin and Admission staff
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  getAllAdmissions
);

/**
 * @route   GET /api/v1/admissions/:id
 * @desc    Get admission application by ID
 * @access  Admin, Admission staff, and application owner
 */
router.get(
  '/:id',
  getAdmissionById
);

/**
 * @route   PUT /api/v1/admissions/:id
 * @desc    Update admission application
 * @access  Application owner
 */
router.put(
  '/:id',
  updateAdmission
);

/**
 * @route   DELETE /api/v1/admissions/:id
 * @desc    Delete admission application
 * @access  Admin and application owner
 */
router.delete(
  '/:id',
  cancelAdmission
);

export default router;
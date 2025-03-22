import { Router } from 'express';
import { ThesisController } from '../controllers/thesis.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/auth.types';
import { AuditResource } from '../models/AuditLog';
import { createAuditedRouter } from '../utils/audit-routes.util';
import { RequestHandler } from 'express';

const thesisController = new ThesisController();
const router = createAuditedRouter(AuditResource.THESIS);

// Convert controller methods to RequestHandler type with proper async handling
const createThesis: RequestHandler = async (req, res, next) => {
  await thesisController.createThesis(req, res);
};

const getAllTheses: RequestHandler = async (req, res, next) => {
  await thesisController.getAllTheses(req, res);
};

const getMyTheses: RequestHandler = async (req, res, next) => {
  await thesisController.getMyTheses(req, res);
};

const getThesisById: RequestHandler = async (req, res, next) => {
  await thesisController.getThesisById(req, res);
};

const updateThesis: RequestHandler = async (req, res, next) => {
  await thesisController.updateThesis(req, res);
};

const uploadThesisDocument: RequestHandler = async (req, res, next) => {
  await thesisController.uploadThesisDocument(req, res);
};

const updateThesisStatus: RequestHandler = async (req, res, next) => {
  await thesisController.updateThesisStatus(req, res);
};

const deleteThesis: RequestHandler = async (req, res, next) => {
  await thesisController.deleteThesis(req, res);
};

/**
 * @route   POST /api/v1/thesis
 * @desc    Create a new thesis
 * @access  Students and Faculty
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.STUDENT, UserRole.FACULTY),
  createThesis
);

/**
 * @route   GET /api/v1/thesis
 * @desc    Get all theses with optional filtering
 * @access  Admin and Faculty
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.FACULTY),
  getAllTheses
);

/**
 * @route   GET /api/v1/thesis/my
 * @desc    Get theses for the logged-in student
 * @access  Authenticated Students
 */
router.get(
  '/my',
  authenticate,
  authorize(UserRole.STUDENT),
  getMyTheses
);

/**
 * @route   GET /api/v1/thesis/:id
 * @desc    Get thesis by ID
 * @access  Admin, Faculty, and thesis owner Student
 */
router.get(
  '/:id',
  authenticate,
  getThesisById
);

/**
 * @route   PUT /api/v1/thesis/:id
 * @desc    Update thesis details
 * @access  Students (own thesis) and Faculty
 */
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.STUDENT, UserRole.FACULTY),
  updateThesis
);

/**
 * @route   POST /api/v1/thesis/:id/upload
 * @desc    Upload thesis document
 * @access  Students (own thesis)
 */
router.post(
  '/:id/upload',
  authenticate,
  authorize(UserRole.STUDENT),
  uploadThesisDocument
);

/**
 * @route   PATCH /api/v1/thesis/:id/status
 * @desc    Update thesis status
 * @access  Faculty only
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize(UserRole.FACULTY),
  updateThesisStatus
);

/**
 * @route   DELETE /api/v1/thesis/:id
 * @desc    Delete thesis
 * @access  Admin only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  deleteThesis
);

export default router;
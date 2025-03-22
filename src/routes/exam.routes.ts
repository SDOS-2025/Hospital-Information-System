import { Router } from 'express';
import { ExamController } from '../controllers/exam.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/auth.types';
import { AuditResource } from '../models/AuditLog';
import { createAuditedRouter } from '../utils/audit-routes.util';
import { RequestHandler } from 'express';

const examController = new ExamController();
const router = createAuditedRouter(AuditResource.EXAM);

// Convert controller methods to RequestHandler type with proper async handling
const createExam: RequestHandler = async (req, res, next) => {
  await examController.createExam(req, res);
};

const getAllExams: RequestHandler = async (req, res, next) => {
  await examController.getAllExams(req, res);
};

const getExamById: RequestHandler = async (req, res, next) => {
  await examController.getExamById(req, res);
};

const updateExam: RequestHandler = async (req, res, next) => {
  await examController.updateExam(req, res);
};

const deleteExam: RequestHandler = async (req, res, next) => {
  await examController.deleteExam(req, res);
};

const uploadMaterials: RequestHandler = async (req, res, next) => {
  await examController.uploadMaterials(req, res);
};

/**
 * @route   POST /api/v1/exams
 * @desc    Create a new exam
 * @access  Faculty and Admin only
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.FACULTY, UserRole.ADMIN),
  createExam
);

/**
 * @route   GET /api/v1/exams
 * @desc    Get all exams with optional filtering
 * @access  All authenticated users
 */
router.get(
  '/',
  authenticate,
  getAllExams
);

/**
 * @route   GET /api/v1/exams/:id
 * @desc    Get exam by ID
 * @access  All authenticated users
 */
router.get(
  '/:id',
  authenticate,
  getExamById
);

/**
 * @route   PUT /api/v1/exams/:id
 * @desc    Update exam details
 * @access  Faculty and Admin only
 */
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.FACULTY, UserRole.ADMIN),
  updateExam
);

/**
 * @route   DELETE /api/v1/exams/:id
 * @desc    Delete exam
 * @access  Admin only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  deleteExam
);

/**
 * @route   POST /api/v1/exams/:id/materials
 * @desc    Upload exam materials
 * @access  Faculty and Admin only
 */
router.post(
  '/:id/materials',
  authenticate,
  authorize(UserRole.FACULTY, UserRole.ADMIN),
  uploadMaterials
);

export default router;

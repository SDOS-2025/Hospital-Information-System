import { Router } from 'express';
import { ExamController } from '../controllers/exam.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/auth.types';

const examController = new ExamController();
const router = Router();

/**
 * @route   POST /api/v1/exams
 * @desc    Create a new exam
 * @access  Faculty and Admin only
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.FACULTY, UserRole.ADMIN),
  examController.createExam
);

/**
 * @route   GET /api/v1/exams
 * @desc    Get all exams with optional filtering
 * @access  All authenticated users
 */
router.get(
  '/',
  authenticate,
  examController.getAllExams
);

/**
 * @route   GET /api/v1/exams/:id
 * @desc    Get exam by ID
 * @access  All authenticated users
 */
router.get(
  '/:id',
  authenticate,
  examController.getExamById
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
  examController.updateExam
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
  examController.deleteExam
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
  examController.uploadMaterials
);

export default router;

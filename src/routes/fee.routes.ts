import { Router } from 'express';
import { FeeController } from '../controllers/fee.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/auth.types';

const feeController = new FeeController();
const router = Router();

/**
 * @route   POST /api/v1/fees
 * @desc    Create a new fee record
 * @access  Admin only
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  feeController.createFeeRecord
);

/**
 * @route   POST /api/v1/fees/bulk
 * @desc    Generate bulk fee records
 * @access  Admin only
 */
router.post(
  '/bulk',
  authenticate,
  authorize(UserRole.ADMIN),
  feeController.generateBulkFees
);

/**
 * @route   GET /api/v1/fees
 * @desc    Get all fees with optional filtering
 * @access  Admin and Staff
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  feeController.getAllFees
);

/**
 * @route   GET /api/v1/fees/my
 * @desc    Get fees for the logged-in student
 * @access  Authenticated Students
 */
router.get(
  '/my',
  authenticate,
  authorize(UserRole.STUDENT),
  feeController.getMyFees
);

/**
 * @route   GET /api/v1/fees/:id
 * @desc    Get fee by ID
 * @access  Admin, Staff, and fee owner Student
 */
router.get(
  '/:id',
  authenticate,
  feeController.getFeeById
);

/**
 * @route   PUT /api/v1/fees/:id
 * @desc    Update fee details
 * @access  Admin only
 */
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  feeController.updateFee
);

/**
 * @route   POST /api/v1/fees/:id/payment
 * @desc    Record fee payment
 * @access  Admin and Staff
 */
router.post(
  '/:id/payment',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  feeController.recordPayment
);

/**
 * @route   POST /api/v1/fees/:id/upload-receipt
 * @desc    Upload payment receipt
 * @access  Admin, Staff, and Students
 */
router.post(
  '/:id/upload-receipt',
  authenticate,
  feeController.uploadReceipt
);

/**
 * @route   POST /api/v1/fees/:id/late-fee
 * @desc    Add late fee
 * @access  Admin only
 */
router.post(
  '/:id/late-fee',
  authenticate,
  authorize(UserRole.ADMIN),
  feeController.addLateFee
);

/**
 * @route   DELETE /api/v1/fees/:id
 * @desc    Delete fee record
 * @access  Admin only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  feeController.deleteFee
);

export default router;
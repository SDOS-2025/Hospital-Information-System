import { Router } from 'express';
import { FeeController } from '../controllers/fee.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/auth.types';
import { AuditResource } from '../models/AuditLog';
import { createAuditedRouter } from '../utils/audit-routes.util';
import { RequestHandler } from 'express';

const feeController = new FeeController();
const router = createAuditedRouter(AuditResource.FEE);

// Convert controller methods to RequestHandler type with proper async handling
const createFeeRecord: RequestHandler = async (req, res, next) => {
  await feeController.createFeeRecord(req, res);
};

const generateBulkFees: RequestHandler = async (req, res, next) => {
  await feeController.generateBulkFees(req, res);
};

const getAllFees: RequestHandler = async (req, res, next) => {
  await feeController.getAllFees(req, res);
};

const getMyFees: RequestHandler = async (req, res, next) => {
  await feeController.getMyFees(req, res);
};

const getFeeById: RequestHandler = async (req, res, next) => {
  await feeController.getFeeById(req, res);
};

const updateFee: RequestHandler = async (req, res, next) => {
  await feeController.updateFee(req, res);
};

const recordPayment: RequestHandler = async (req, res, next) => {
  await feeController.recordPayment(req, res);
};

const uploadReceipt: RequestHandler = async (req, res, next) => {
  await feeController.uploadReceipt(req, res);
};

const addLateFee: RequestHandler = async (req, res, next) => {
  await feeController.addLateFee(req, res);
};

const deleteFee: RequestHandler = async (req, res, next) => {
  await feeController.deleteFee(req, res);
};

router.post('/', authenticate, authorize(UserRole.ADMIN), createFeeRecord);
router.post('/bulk', authenticate, authorize(UserRole.ADMIN), generateBulkFees);
router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.STAFF), getAllFees);
router.get('/my', authenticate, authorize(UserRole.STUDENT), getMyFees);
router.get('/:id', authenticate, getFeeById);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), updateFee);
router.post('/:id/payment', authenticate, authorize(UserRole.ADMIN, UserRole.STAFF), recordPayment);
router.post('/:id/upload-receipt', authenticate, uploadReceipt);
router.post('/:id/late-fee', authenticate, authorize(UserRole.ADMIN), addLateFee);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deleteFee);

export default router;
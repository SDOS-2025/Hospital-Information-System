import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/auth.types';
import { RequestHandler } from 'express';

const auditController = new AuditController();
const router = Router();

// Convert controller methods to RequestHandler type with proper async handling
const getAllLogs: RequestHandler = async (req, res, next) => {
  await auditController.getAllLogs(req, res);
};

const getLogsByResource: RequestHandler = async (req, res, next) => {
  await auditController.getLogsByResource(req, res);
};

const getLogsByUser: RequestHandler = async (req, res, next) => {
  await auditController.getLogsByUser(req, res);
};

/**
 * @route   GET /api/v1/audit
 * @desc    Get all audit logs with optional filtering
 * @access  Admin only
 */
router.get('/', authenticate, authorize(UserRole.ADMIN), getAllLogs);

/**
 * @route   GET /api/v1/audit/resource/:resource
 * @desc    Get audit logs for a specific resource type
 * @access  Admin only
 */
router.get('/resource/:resource', authenticate, authorize(UserRole.ADMIN), getLogsByResource);

/**
 * @route   GET /api/v1/audit/resource/:resource/:resourceId
 * @desc    Get audit logs for a specific resource instance
 * @access  Admin only
 */
router.get('/resource/:resource/:resourceId', authenticate, authorize(UserRole.ADMIN), getLogsByResource);

/**
 * @route   GET /api/v1/audit/user/:userId
 * @desc    Get audit logs for a specific user
 * @access  Admin only
 */
router.get('/user/:userId', authenticate, authorize(UserRole.ADMIN), getLogsByUser);

export default router;
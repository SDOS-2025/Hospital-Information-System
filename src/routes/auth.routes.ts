import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { AuditResource } from '../models/AuditLog';
import { createAuditedRouter } from '../utils/audit-routes.util';
import { RequestHandler } from 'express';

const authController = new AuthController();
const router = createAuditedRouter(AuditResource.SYSTEM);

// Convert controller methods to RequestHandler type with proper async handling
const register: RequestHandler = async (req, res, next) => {
  await authController.register(req, res);
};

const login: RequestHandler = async (req, res, next) => {
  await authController.login(req, res);
};

const logout: RequestHandler = async (req, res, next) => {
  await authController.logout(req, res);
};

const forgotPassword: RequestHandler = async (req, res, next) => {
  await authController.forgotPassword(req, res);
};

const resetPassword: RequestHandler = async (req, res, next) => {
  await authController.resetPassword(req, res);
};

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Log in a user and get tokens
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Log out a user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password/:token
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password/:token', resetPassword);

export default router;
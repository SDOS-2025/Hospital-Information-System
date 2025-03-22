import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { RequestHandler } from 'express';

const authController = new AuthController();
const router = Router();

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
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout a user (for audit purposes)
 * @access  Protected
 */
router.post('/logout', authenticate, logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', resetPassword);

export default router;
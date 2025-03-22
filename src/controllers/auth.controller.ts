import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../types/auth.types';
import { AuthRequest } from '../types/auth.types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new user
   */
  register = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { firstName, lastName, email, password, role } = req.body;

      // Validate input
      if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide all required fields: firstName, lastName, email, password, role'
        });
      }

      // Validate role
      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`
        });
      }

      const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
      const userAgent = req.headers['user-agent'];

      // Register user
      const user = await this.authService.register(
        {
          firstName,
          lastName,
          email,
          password,
          role: role as UserRole
        },
        ipAddress,
        userAgent
      );

      return res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'An error occurred during registration'
      });
    }
  };

  /**
   * Login user
   */
  login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide email and password'
        });
      }

      const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
      const userAgent = req.headers['user-agent'];

      // Login user
      const { user, token } = await this.authService.login(email, password, ipAddress, userAgent);

      return res.status(200).json({
        status: 'success',
        message: 'Logged in successfully',
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture
          },
          token
        }
      });
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'An error occurred during login'
      });
    }
  };

  /**
   * Forgot password
   */
  forgotPassword = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide your email'
        });
      }

      const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
      const userAgent = req.headers['user-agent'];

      await this.authService.forgotPassword(email, ipAddress, userAgent);

      return res.status(200).json({
        status: 'success',
        message: 'Password reset link sent to your email'
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  };

  /**
   * Reset password
   */
  resetPassword = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide token and new password'
        });
      }

      const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
      const userAgent = req.headers['user-agent'];

      await this.authService.resetPassword(token, password, ipAddress, userAgent);

      return res.status(200).json({
        status: 'success',
        message: 'Password has been reset successfully'
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  };

  /**
   * Logout user
   */
  logout = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
      const userAgent = req.headers['user-agent'];

      await this.authService.logout(req.user.id, ipAddress, userAgent);

      return res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  };
}
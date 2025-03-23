import { Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { User } from '../models/User';
import { TokenPayload, UserRole } from '../types/auth.types';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email.util';
import { AuditService } from './audit.service';
import { AuditAction, AuditResource } from '../models/AuditLog';

export class AuthService {
  private userRepository: Repository<User>;
  private auditService: AuditService;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.auditService = new AuditService();
  }

  /**
   * Register a new user
   */
  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
  }, ipAddress: string, userAgent?: string): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const user = this.userRepository.create({
      ...userData,
      isActive: true,
    });

    // Save user to database
    await this.userRepository.save(user);

    // Send welcome email
    await sendWelcomeEmail(
      `${user.firstName} ${user.lastName}`,
      user.email,
      user.role
    );

    // Log the user creation
    await this.auditService.createLog({
      action: AuditAction.CREATE,
      resource: AuditResource.USER,
      resourceId: user.id,
      description: `User registered: ${user.email} (${user.role})`,
      userId: user.id,
      ipAddress,
      userAgent
    });

    return user;
  }

  /**
   * Login user and generate JWT token
   */
  async login(email: string, password: string, ipAddress: string, userAgent?: string, requiredRole?: UserRole): Promise<{ user: User; token: string }> {
    // Find user by email with password included
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      // Log failed login attempt
      await this.auditService.createLog({
        action: AuditAction.FAILED_LOGIN,
        resource: AuditResource.USER,
        description: `Failed login attempt for email: ${email}`,
        ipAddress,
        userAgent
      });
      
      throw new Error('Invalid email or password');
    }

    // Validate role if specified
    if (requiredRole && user.role !== requiredRole) {
      await this.auditService.createLog({
        action: AuditAction.FAILED_LOGIN,
        resource: AuditResource.USER,
        resourceId: user.id,
        description: `Failed login attempt (wrong role type: ${requiredRole}): ${email}`,
        userId: user.id,
        ipAddress,
        userAgent
      });
      
      throw new Error(`Invalid credentials for ${requiredRole} login`);
    }

    if (!user.isActive) {
      await this.auditService.createLog({
        action: AuditAction.FAILED_LOGIN,
        resource: AuditResource.USER,
        resourceId: user.id,
        description: `Login attempt for inactive account: ${email}`,
        userId: user.id,
        ipAddress,
        userAgent
      });
      
      throw new Error('Your account is not active. Please contact the administrator.');
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      await this.auditService.createLog({
        action: AuditAction.FAILED_LOGIN,
        resource: AuditResource.USER,
        resourceId: user.id,
        description: `Failed login attempt (wrong password): ${email}`,
        userId: user.id,
        ipAddress,
        userAgent
      });
      
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    // Log successful login
    await this.auditService.createLog({
      action: AuditAction.LOGIN,
      resource: AuditResource.USER,
      resourceId: user.id,
      description: `User logged in: ${user.email} (${user.role})`,
      userId: user.id,
      ipAddress,
      userAgent
    });

    // Hide password in returned user object
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword as User, token };
  }

  /**
   * Generate password reset token and send email
   */
  async forgotPassword(email: string, ipAddress: string, userAgent?: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiration = new Date();
    resetTokenExpiration.setHours(resetTokenExpiration.getHours() + 1); // Token expires in 1 hour

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiration;
    await this.userRepository.save(user);

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send password reset email
    await sendPasswordResetEmail(
      `${user.firstName} ${user.lastName}`,
      user.email,
      resetUrl
    );

    // Log password reset request
    await this.auditService.createLog({
      action: AuditAction.UPDATE,
      resource: AuditResource.USER,
      resourceId: user.id,
      description: `Password reset requested for: ${user.email}`,
      userId: user.id,
      ipAddress,
      userAgent
    });
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string, ipAddress: string, userAgent?: string): Promise<void> {
    // Find user by reset token
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token }
    });

    if (!user) {
      throw new Error('Invalid or expired password reset token');
    }

    // Check if token has expired
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new Error('Password reset token has expired');
    }

    // Update user's password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await this.userRepository.save(user);

    // Log password reset
    await this.auditService.createLog({
      action: AuditAction.UPDATE,
      resource: AuditResource.USER,
      resourceId: user.id,
      description: `Password reset successful for: ${user.email}`,
      userId: user.id,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log out user (for audit purposes only, JWT is stateless)
   */
  async logout(userId: string, ipAddress: string, userAgent?: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Log user logout
    await this.auditService.createLog({
      action: AuditAction.LOGOUT,
      resource: AuditResource.USER,
      resourceId: userId,
      description: `User logged out: ${user.email}`,
      userId,
      ipAddress,
      userAgent
    });
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: User): string {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const options: SignOptions = {
      expiresIn: Number(process.env.JWT_EXPIRES_IN) || '24h' as any
    };

    return jwt.sign(payload, secret, options);
  }
}
import { Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { User } from '../models/User';
import { TokenPayload, UserRole } from '../types/auth.types';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email.util';

export class AuthService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
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
  }): Promise<User> {
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

    return user;
  }

  /**
   * Login user and generate JWT token
   */
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Find user by email with password included
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Your account is not active. Please contact the administrator.');
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    // Hide password in returned user object
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword as User, token };
  }

  /**
   * Generate password reset token and send email
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email }
    });

    if (!user) {
      throw new Error('No user found with this email address');
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userRepository.save(user);

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(
        `${user.firstName} ${user.lastName}`,
        user.email,
        resetUrl
      );
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await this.userRepository.save(user);
      throw new Error('Error sending password reset email');
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Hash the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by token
    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now()) as any
      }
    });

    if (!user) {
      throw new Error('Invalid or expired token');
    }

    // Update user password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await this.userRepository.save(user);
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: User): string {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET as string,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      }
    );
  }
}
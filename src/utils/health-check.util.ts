import { AppDataSource } from '../db/data-source';
import { Redis } from 'ioredis';
import sgMail from '@sendgrid/mail';
import { S3 } from './s3.util';
import { ListBucketsCommand } from '@aws-sdk/client-s3';

export interface HealthStatus {
  overall: boolean;
  database: boolean;
  redis: boolean;
  email: boolean;
  storage: boolean;
  details: {
    database?: string;
    redis?: string;
    email?: string;
    storage?: string;
  };
}

export class HealthCheck {
  private redis?: Redis;

  constructor(redisClient?: Redis) {
    this.redis = redisClient;
  }

  public async checkAll(): Promise<HealthStatus> {
    const [dbResult, redisResult, emailResult, storageResult] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkEmail(),
      this.checkStorage(),
    ]);

    const status: HealthStatus = {
      overall: false,
      database: false,
      redis: false,
      email: false,
      storage: false,
      details: {},
    };

    // Process database check result
    status.database = dbResult.success;
    if (!dbResult.success && dbResult.error) {
      status.details.database = dbResult.error instanceof Error 
        ? dbResult.error.message 
        : 'Database connection failed';
    }

    // Process Redis check result - Redis is optional
    if (!this.redis) {
      status.redis = true; // Redis is considered healthy when disabled
      status.details.redis = 'Redis is disabled';
    } else {
      status.redis = redisResult.success;
      if (!redisResult.success && redisResult.error) {
        status.details.redis = redisResult.error instanceof Error 
          ? redisResult.error.message 
          : 'Redis connection failed';
      }
    }

    // Process email check result
    status.email = emailResult.success;
    if (!emailResult.success && emailResult.error) {
      status.details.email = emailResult.error instanceof Error 
        ? emailResult.error.message 
        : 'Email service configuration failed';
    }

    // Process storage check result
    status.storage = storageResult.success;
    if (!storageResult.success && storageResult.error) {
      status.details.storage = storageResult.error instanceof Error 
        ? storageResult.error.message 
        : 'S3 connection failed';
    }

    // Overall status - Redis is not considered in overall health when disabled
    status.overall = status.database && status.email && status.storage && 
      (this.redis ? status.redis : true);

    return status;
  }

  public async checkDatabase(): Promise<{ success: boolean; error?: unknown }> {
    try {
      if (AppDataSource.isInitialized) {
        await AppDataSource.query('SELECT 1');
        return { success: true };
      }
      return { success: false, error: new Error('Database not initialized') };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async checkRedis(): Promise<{ success: boolean; error?: unknown }> {
    if (!this.redis) {
      return { success: true }; // Redis is considered healthy when disabled
    }

    try {
      await this.redis.ping();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async checkEmail(): Promise<{ success: boolean; error?: unknown }> {
    try {
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        throw new Error('SendGrid API key not configured');
      }
      sgMail.setApiKey(apiKey);
      // Note: This is making the function async for consistency, even though
      // there's no actual async operation right now. In a real-world scenario,
      // we might want to make a test call to SendGrid's API to really verify.
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async checkStorage(): Promise<{ success: boolean; error?: unknown }> {
    try {
      // Use the S3 client directly with AWS SDK v3 command pattern
      await S3.send(new ListBucketsCommand({}));
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }
}
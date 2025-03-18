import { AppDataSource } from '../db/data-source';
import { Redis } from 'ioredis';
import sgMail from '@sendgrid/mail';
import AWS from 'aws-sdk';
import { S3 } from './s3.util';

export interface HealthStatus {
  database: boolean;
  redis: boolean;
  email: boolean;
  storage: boolean;
  overall: boolean;
  details: {
    database?: string;
    redis?: string;
    email?: string;
    storage?: string;
  };
}

export class HealthCheck {
  private redis: Redis;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  public async checkAll(): Promise<HealthStatus> {
    const status: HealthStatus = {
      database: false,
      redis: false,
      email: false,
      storage: false,
      overall: false,
      details: {}
    };

    // Check database
    try {
      if (AppDataSource.isInitialized) {
        await AppDataSource.query('SELECT 1');
        status.database = true;
      }
    } catch (error) {
      status.details.database = error instanceof Error ? error.message : 'Database connection failed';
    }

    // Check Redis
    try {
      await this.redis.ping();
      status.redis = true;
    } catch (error) {
      status.details.redis = error instanceof Error ? error.message : 'Redis connection failed';
    }

    // Check SendGrid
    try {
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        throw new Error('SendGrid API key not configured');
      }
      sgMail.setApiKey(apiKey);
      status.email = true;
    } catch (error) {
      status.details.email = error instanceof Error ? error.message : 'Email service configuration failed';
    }

    // Check S3
    try {
      const s3 = S3.getInstance();
      await s3.listBuckets().promise();
      status.storage = true;
    } catch (error) {
      status.details.storage = error instanceof Error ? error.message : 'S3 connection failed';
    }

    // Overall status
    status.overall = status.database && status.redis && status.email && status.storage;

    return status;
  }

  public async checkDatabase(): Promise<boolean> {
    try {
      if (AppDataSource.isInitialized) {
        await AppDataSource.query('SELECT 1');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public async checkRedis(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  public checkEmail(): boolean {
    try {
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        return false;
      }
      sgMail.setApiKey(apiKey);
      return true;
    } catch {
      return false;
    }
  }

  public async checkStorage(): Promise<boolean> {
    try {
      const s3 = S3.getInstance();
      await s3.listBuckets().promise();
      return true;
    } catch {
      return false;
    }
  }
}
import { HealthCheck } from '../utils/health-check.util';
import Redis from 'ioredis';
import { AppDataSource } from '../db/data-source';

describe('System Health Checks', () => {
  let healthCheck: HealthCheck;
  let redis: Redis;
  
  beforeAll(async () => {
    // Use mock Redis from setup.ts
    redis = new Redis();
    healthCheck = new HealthCheck(redis);
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
    await redis.disconnect();
  });

  it('should check database connection', async () => {
    const result = await healthCheck.checkDatabase();
    expect(result).toBe(true);
  });

  it('should check redis connection', async () => {
    const result = await healthCheck.checkRedis();
    expect(result).toBe(true);
  });

  it('should check email service configuration', () => {
    const result = healthCheck.checkEmail();
    expect(result).toBe(true);
  });

  it('should check S3 storage connection', async () => {
    const result = await healthCheck.checkStorage();
    expect(result).toBe(true);
  });

  it('should perform complete health check', async () => {
    const status = await healthCheck.checkAll();
    expect(status.overall).toBe(true);
    expect(status.database).toBe(true);
    expect(status.redis).toBe(true);
    expect(status.email).toBe(true);
    expect(status.storage).toBe(true);
  });
});
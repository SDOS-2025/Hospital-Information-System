import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({
  path: path.join(__dirname, '../../.env.test')
});

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue('mockValue'),
    set: jest.fn().mockResolvedValue('OK'),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  }));
});

// Global test timeout
jest.setTimeout(30000);
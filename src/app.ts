import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import { AppDataSource } from './db/data-source';
import Redis from 'ioredis';
import apiRoutes from './routes';
import { HealthCheck } from './utils/health-check.util';

// Load environment variables
config();

class App {
  public app: express.Application;
  public redis: Redis;
  private healthCheck: HealthCheck;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.setupDatabase();
    this.setupRedis();
    this.setupHealthCheck();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private configureMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());
    
    // Request parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Logging
    this.app.use(morgan('dev'));
  }

  private async setupDatabase(): Promise<void> {
    try {
      await AppDataSource.initialize();
      console.log('Database connection established');
    } catch (error) {
      console.error('Error connecting to database:', error);
    }
  }

  private setupRedis(): void {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      });
      console.log('Redis connection established');
    } catch (error) {
      console.error('Error connecting to Redis:', error);
    }
  }

  private setupHealthCheck(): void {
    this.healthCheck = new HealthCheck(this.redis);
  }

  private setupRoutes(): void {
    // Health check route
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const status = await this.healthCheck.checkAll();
        res.status(status.overall ? 200 : 503).json({
          status: status.overall ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          services: {
            database: {
              status: status.database ? 'up' : 'down',
              message: status.details.database
            },
            redis: {
              status: status.redis ? 'up' : 'down',
              message: status.details.redis
            },
            email: {
              status: status.email ? 'up' : 'down',
              message: status.details.email
            },
            storage: {
              status: status.storage ? 'up' : 'down',
              message: status.details.storage
            }
          }
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: 'Failed to check system health',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // API routes with versioning
    this.app.use('/api/v1', apiRoutes);
  }

  private setupErrorHandling(): void {
    // Handle 404
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        status: 'error',
        message: 'Route not found'
      });
    });

    // Global error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error(err);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });
  }
}

export default new App().app;
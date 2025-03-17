import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import { AppDataSource } from './db/data-source';
import Redis from 'ioredis';
import apiRoutes from './routes';

// Load environment variables
config();

class App {
  public app: express.Application;
  public redis: Redis;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.setupDatabase();
    this.setupRedis();
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

  private setupRoutes(): void {
    // Health check route
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ 
        status: 'success', 
        message: 'Server is healthy',
        timestamp: new Date().toISOString()
      });
    });

    // API routes with versioning
    this.app.use('/api/v1', apiRoutes);
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        status: 'error',
        message: `Cannot ${req.method} ${req.url}`
      });
    });

    // Global error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error(err);
      res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production' 
          ? 'Internal Server Error' 
          : err.message
      });
    });
  }
}

export default new App().app;
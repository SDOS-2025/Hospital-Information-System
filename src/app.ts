import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "dotenv";
import { AppDataSource } from "./db/data-source";
import Redis from "ioredis";
import apiRoutes from "./routes";
import { HealthCheck } from "./utils/health-check.util";
import { AuditService } from "./services/audit.service";
import { AuditAction, AuditResource } from "./models/AuditLog";

// Load environment variables
config();

class App {
  public app: express.Application;
  public redis?: Redis; // Make redis optional
  private healthCheck: HealthCheck;
  private auditService: AuditService;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    try {
      await this.setupDatabase();
      this.setupRedis();
      this.setupHealthCheck();
      this.setupAuditService();
      this.setupRoutes();
      this.setupErrorHandling();
      console.log("Application initialized successfully");
    } catch (error) {
      console.error("Failed to initialize application:", error);
      // Consider implementing a more graceful shutdown or retry mechanism here
    }
  }

  private configureMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173", // Deployed frontend URL
      })
    );

    // Request parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logging
    this.app.use(morgan("dev"));
  }

  private async setupDatabase(): Promise<void> {
    try {
      await AppDataSource.initialize();
      console.log("Database connection established");
    } catch (error) {
      console.error("Error connecting to database:", error);
      throw error; // Re-throw the error to be caught by initializeApp
    }
  }

  private setupRedis(): void {
    // Check if Redis is explicitly disabled
    if (process.env.REDIS_ENABLED === "false") {
      console.log("Redis is disabled by configuration");
      return;
    }

    try {
      const redis = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,
        maxRetriesPerRequest: 1,
        lazyConnect: true, // Don't connect immediately
        retryStrategy: () => null, // Disable retries completely
      });

      // Handle connection events
      redis.on("error", (error) => {
        console.warn("Redis connection error:", error);
        if (!this.redis) {
          // Only log this message on initial connection failure
          console.log("Application will continue without Redis");
        }
        // Clean up the failed connection
        redis.disconnect();
      });

      redis.on("connect", () => {
        console.log("Redis connection established");
        this.redis = redis;
      });

      // Attempt to connect
      redis.connect().catch(() => {
        // Connection error is already handled by the error event
      });
    } catch (error) {
      console.warn("Failed to initialize Redis:", error);
      console.log("Application will continue without Redis");
    }
  }

  private setupHealthCheck(): void {
    this.healthCheck = new HealthCheck(this.redis);
  }

  private setupAuditService(): void {
    this.auditService = new AuditService();
  }

  private setupRoutes(): void {
    // Health check route
    this.app.get("/health", async (req: Request, res: Response) => {
      try {
        const status = await this.healthCheck.checkAll();
        const ipAddress = (req.headers["x-forwarded-for"] ||
          req.socket.remoteAddress) as string;

        // Log the health check result
        await this.auditService.createLog({
          action: AuditAction.READ,
          resource: AuditResource.SYSTEM,
          description: `Health check performed: System is ${
            status.overall ? "healthy" : "unhealthy"
          }`,
          userId: (req as any).user?.id, // Will be undefined for unauthenticated requests
          ipAddress,
          userAgent: req.headers["user-agent"],
          details: {
            overall: status.overall,
            database: status.database,
            redis: status.redis,
            email: status.email,
            storage: status.storage,
          },
        });

        res.status(status.overall ? 200 : 503).json({
          status: status.overall ? "healthy" : "unhealthy",
          timestamp: new Date().toISOString(),
          services: {
            database: {
              status: status.database ? "up" : "down",
              message: status.details.database,
            },
            redis: {
              status: status.redis ? "up" : "down",
              message: status.details.redis,
            },
            email: {
              status: status.email ? "up" : "down",
              message: status.details.email,
            },
            storage: {
              status: status.storage ? "up" : "down",
              message: status.details.storage,
            },
          },
        });
      } catch (error) {
        res.status(500).json({
          status: "error",
          message: "Failed to check system health",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    // API routes with versioning
    this.app.use("/api/v1", apiRoutes);
  }

  private setupErrorHandling(): void {
    // Handle 404
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        status: "error",
        message: "Route not found",
      });
    });

    // Global error handler
    this.app.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(err);
        res.status(500).json({
          status: "error",
          message: "Internal server error",
          error:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      }
    );
  }
}

export default new App().app;

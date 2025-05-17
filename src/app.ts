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
    if (process.env.REDIS_ENABLED === "false") {
      console.log("Redis is disabled by configuration");
      return;
    }

    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn(
        "REDIS_URL is not defined in environment variables. Application will continue without Redis."
      );
      // Just skip Redis if REDIS_URL isn't set.
      return;
    }

    try {
      console.log(
        `Attempting to connect to Redis at: ${redisUrl.replace(
          /:[^@:]*@/,
          ":<password_hidden>@"
        )}`
      ); // Log URL but hide password

      const redisInstance = new Redis(redisUrl, {
        // Pass the URL directly
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) {
            // Try 3 times then give up, free tier limitation
            return null;
          }
          return Math.min(times * 200, 2000); // Exponential backoff
        },
        // Recommended for Upstash or cloud providers with TLS
        tls:
          redisUrl.startsWith("rediss://") || redisUrl.includes("upstash.io")
            ? {}
            : undefined,
      });

      redisInstance.on("connect", () => {
        console.log("Redis connection established successfully.");
        this.redis = redisInstance;
      });

      redisInstance.on("error", (error: Error) => {
        console.error("Redis connection error:", error.message);
        // If it fails to connect initially, this.redis might not be set yet.
        if (this.redis === redisInstance) {
          // Check if it's the same instance
          this.redis = undefined; // Clear the instance if connection is lost after being established
        }
        console.log(
          "Application will continue without Redis functionality due to connection error."
        );
        redisInstance.disconnect(); // Ensure we clean up the failed connection attempt
      });

      redisInstance.on("ready", () => {
        console.log("Redis client is ready.");
      });

      // Attempt to connect (lazyConnect means it won't connect until the first command or .connect() is called)
      redisInstance.connect().catch((err) => {
        // Error handling is already done by the 'error' event listener,
        // but you can log an initial connection failure specifically here if needed.
        console.error("Initial Redis connect() promise rejected:", err.message);
      });
    } catch (error) {
      const e = error as Error;
      console.warn(
        "Failed to initialize Redis client due to an exception:",
        e.message
      );
      console.log("Application will continue without Redis.");
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

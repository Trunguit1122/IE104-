import "reflect-metadata";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { config } from "dotenv";
import { initializeDatabase } from "./config/database";
import { RegisterRoutes } from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { 
  generalRateLimiter, 
  loginRateLimiter, 
  authRateLimiter, 
  passwordResetRateLimiter 
} from "./middleware/rateLimiter";
import { emailService } from "./services/email.service";

// Load environment variables
config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Security headers (HSTS will be applied by reverse proxy in production)
app.use((req, res, next) => {
  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // HSTS - only in production with HTTPS
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  
  next();
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply specific rate limiters for auth routes (stricter limits)
app.use("/api/auth/signin", loginRateLimiter);           // 5 req/min, 15 min block
app.use("/api/auth/signup", authRateLimiter);            // 10 req/min, 5 min block
app.use("/api/auth/forgot-password", passwordResetRateLimiter);  // 3 req/15min, 30 min block
app.use("/api/auth/resend-verification", passwordResetRateLimiter);
app.use("/api/auth/reset-password", authRateLimiter);

// Apply general rate limiting to all routes
app.use(generalRateLimiter);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "LingoLab Backend API",
  });
});

// Swagger documentation
try {
  const swaggerDocument = require("./swagger.json");
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: "LingoLab API Documentation",
    customCss: ".swagger-ui .topbar { display: none }",
  }));
  console.log("📚 Swagger documentation available at /docs");
} catch (error) {
  console.warn("⚠️  Swagger documentation not available. Run 'npm run swagger' to generate.");
}

// Serve static files for uploads and exports
app.use("/uploads", express.static("uploads"));
app.use("/exports", express.static("exports"));

// Register tsoa routes
RegisterRoutes(app);

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to LingoLab API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      api: "/api",
      docs: "/docs",
    },
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database and start server
const startServer = async (): Promise<void> => {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Verify email service connection
    await emailService.verifyConnection();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 LingoLab Backend API is running on port ${PORT}`);
      console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
      console.log(`🔒 Rate Limiting: Enabled`);
      console.log(`📁 Static Files: /uploads, /exports`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

// Start the application
startServer();

export default app;

import { Request, Response, NextFunction } from "express";

/**
 * Rate Limiter Middleware
 * Implements rate limiting for API endpoints to prevent abuse
 * 
 * Security Requirements:
 * - Prevent brute-force attacks
 * - Protect against DDoS
 * - Fair usage policy
 */

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  blockedUntil?: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  blockDurationMs: number; // How long to block after exceeding limit
  message?: string;
}

// In-memory store (for single instance; use Redis for distributed)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.blockedUntil && entry.blockedUntil < now) {
      rateLimitStore.delete(key);
    } else if (now - entry.firstRequest > 3600000) { // 1 hour
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Get client identifier (IP + User-Agent hash for better accuracy)
 */
function getClientId(req: Request): string {
  const ip = req.ip || 
    req.headers["x-forwarded-for"]?.toString().split(",")[0] || 
    req.socket.remoteAddress || 
    "unknown";
  return ip;
}

/**
 * Create a rate limiter middleware with custom config
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Disable rate limiting in development/testing mode
    if (process.env.DISABLE_RATE_LIMIT === 'true' || process.env.NODE_ENV === 'test') {
      return next();
    }
    
    const clientId = getClientId(req);
    const now = Date.now();
    
    let entry = rateLimitStore.get(clientId);

    // Check if currently blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
      res.setHeader("Retry-After", retryAfter.toString());
      res.setHeader("X-RateLimit-Limit", config.maxRequests.toString());
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", entry.blockedUntil.toString());
      
      res.status(429).json({
        success: false,
        message: config.message || "Too many requests. Please try again later.",
        retryAfter,
      });
      return;
    }

    // Initialize or reset if window expired
    if (!entry || now - entry.firstRequest > config.windowMs) {
      entry = {
        count: 1,
        firstRequest: now,
      };
      rateLimitStore.set(clientId, entry);
    } else {
      entry.count++;
    }

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      entry.blockedUntil = now + config.blockDurationMs;
      rateLimitStore.set(clientId, entry);

      const retryAfter = Math.ceil(config.blockDurationMs / 1000);
      res.setHeader("Retry-After", retryAfter.toString());
      res.setHeader("X-RateLimit-Limit", config.maxRequests.toString());
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", entry.blockedUntil.toString());

      res.status(429).json({
        success: false,
        message: config.message || "Too many requests. Please try again later.",
        retryAfter,
      });
      return;
    }

    // Set rate limit headers
    const remaining = config.maxRequests - entry.count;
    const resetTime = entry.firstRequest + config.windowMs;
    
    res.setHeader("X-RateLimit-Limit", config.maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", resetTime.toString());

    next();
  };
}

/**
 * Preset rate limiters for different endpoints
 */

// General API rate limiter
// 100 requests per minute, block for 1 minute
export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 100,
  blockDurationMs: 60 * 1000, // 1 minute block
  message: "Too many requests. Please slow down.",
});

// Authentication endpoints (stricter)
// 10 requests per minute, block for 5 minutes
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 10,
  blockDurationMs: 5 * 60 * 1000, // 5 minutes block
  message: "Too many authentication attempts. Please try again in 5 minutes.",
});

// Login endpoint (strictest to prevent brute-force)
// 5 requests per minute, block for 15 minutes
export const loginRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 5,
  blockDurationMs: 15 * 60 * 1000, // 15 minutes block
  message: "Too many login attempts. Please try again in 15 minutes.",
});

// Password reset (prevent email enumeration)
// 3 requests per 15 minutes
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 3,
  blockDurationMs: 30 * 60 * 1000, // 30 minutes block
  message: "Too many password reset requests. Please try again later.",
});

// File upload (prevent storage abuse)
// 20 uploads per hour
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,
  blockDurationMs: 60 * 60 * 1000, // 1 hour block
  message: "Upload limit exceeded. Please try again later.",
});

// AI Scoring (expensive operation)
// 10 requests per 5 minutes
export const scoringRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  maxRequests: 10,
  blockDurationMs: 10 * 60 * 1000, // 10 minutes block
  message: "Scoring request limit exceeded. Please wait before submitting more attempts.",
});

// Export report (expensive operation)
// 5 exports per hour
export const exportRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  blockDurationMs: 60 * 60 * 1000, // 1 hour block
  message: "Export limit exceeded. Please try again later.",
});

/**
 * Middleware to get rate limit info for current client
 */
export function getRateLimitInfo(req: Request): {
  remaining: number;
  resetTime: number;
  blocked: boolean;
} {
  const clientId = getClientId(req);
  const entry = rateLimitStore.get(clientId);
  const now = Date.now();

  if (!entry) {
    return { remaining: 100, resetTime: now + 60000, blocked: false };
  }

  return {
    remaining: Math.max(0, 100 - entry.count),
    resetTime: entry.firstRequest + 60000,
    blocked: !!(entry.blockedUntil && entry.blockedUntil > now),
  };
}







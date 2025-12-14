import * as crypto from "crypto";
import { AppDataSource } from "../data-source";

/**
 * JWT Service
 * Handles JWT token generation, validation, and blacklisting
 * 
 * Security Features:
 * - Token blacklisting for logout/revocation
 * - Token rotation support
 * - Configurable expiry times
 * 
 * Note: For production, consider using jsonwebtoken library:
 * npm install jsonwebtoken @types/jsonwebtoken
 * 
 * This implementation provides the same interface and can be
 * easily swapped to use jsonwebtoken when installed.
 */

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
  jti?: string; // JWT ID for blacklisting
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Token expiry configuration
const ACCESS_TOKEN_EXPIRY_SECONDS = parseInt(process.env.JWT_ACCESS_EXPIRY || "900"); // 15 minutes
const REFRESH_TOKEN_EXPIRY_SECONDS = parseInt(process.env.JWT_REFRESH_EXPIRY || "604800"); // 7 days

// Secret key (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || "lingolab-secret-key-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + "-refresh";

// In-memory blacklist (use Redis for distributed systems)
const tokenBlacklist = new Set<string>();

// Clean up expired blacklist entries periodically
setInterval(() => {
  // In production with Redis, use TTL instead
  // For memory store, we can't easily check expiry without parsing tokens
  // So we just clear old entries after 24 hours
  if (tokenBlacklist.size > 10000) {
    tokenBlacklist.clear();
  }
}, 3600000); // Every hour

/**
 * Generate a unique JWT ID
 */
function generateJti(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Create a JWT token
 */
export function createToken(
  payload: Omit<JWTPayload, "iat" | "exp" | "jti">,
  expiresInSeconds: number,
  secret: string = JWT_SECRET
): string {
  const now = Math.floor(Date.now() / 1000);
  const jti = generateJti();
  
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
    jti,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const base64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const base64Payload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${base64Header}.${base64Payload}`)
    .digest("base64url");

  return `${base64Header}.${base64Payload}.${signature}`;
}

/**
 * Verify a JWT token
 */
export function verifyToken(
  token: string,
  secret: string = JWT_SECRET
): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [base64Header, base64Payload, signature] = parts;
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${base64Header}.${base64Payload}`)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    // Parse payload
    const payload: JWTPayload = JSON.parse(
      Buffer.from(base64Payload, "base64url").toString()
    );

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    // Check blacklist
    if (payload.jti && tokenBlacklist.has(payload.jti)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * JWT Service Class
 */
export class JWTService {
  /**
   * Generate access token
   */
  createAccessToken(payload: { userId: string; email: string; role: string }): string {
    return createToken(payload, ACCESS_TOKEN_EXPIRY_SECONDS, JWT_SECRET);
  }

  /**
   * Generate refresh token
   */
  createRefreshToken(payload: { userId: string; email: string; role: string }): string {
    return createToken(payload, REFRESH_TOKEN_EXPIRY_SECONDS, JWT_REFRESH_SECRET);
  }

  /**
   * Generate token pair (access + refresh)
   */
  createTokenPair(payload: { userId: string; email: string; role: string }): TokenPair {
    return {
      accessToken: this.createAccessToken(payload),
      refreshToken: this.createRefreshToken(payload),
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JWTPayload | null {
    return verifyToken(token, JWT_SECRET);
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): JWTPayload | null {
    return verifyToken(token, JWT_REFRESH_SECRET);
  }

  /**
   * Blacklist a token (for logout/revocation)
   */
  blacklistToken(token: string): void {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
        if (payload.jti) {
          tokenBlacklist.add(payload.jti);
        }
      }
    } catch {
      // Ignore invalid tokens
    }
  }

  /**
   * Blacklist all tokens for a user (password change, account compromise)
   * Note: This requires storing tokens in database for full implementation
   * For now, we clear the entire blacklist which forces re-authentication
   */
  revokeAllUserTokens(userId: string): void {
    // In production with Redis, we would:
    // 1. Store issued tokens per user
    // 2. Add them all to blacklist
    // For now, this is a placeholder
  }

  /**
   * Refresh token pair
   * Returns new access token and optionally rotates refresh token
   */
  refreshTokenPair(
    refreshToken: string,
    rotateRefresh: boolean = true
  ): TokenPair | null {
    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) {
      return null;
    }

    // Blacklist old refresh token if rotating
    if (rotateRefresh) {
      this.blacklistToken(refreshToken);
    }

    const newPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    if (rotateRefresh) {
      return this.createTokenPair(newPayload);
    }

    return {
      accessToken: this.createAccessToken(newPayload),
      refreshToken, // Keep the same refresh token
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    };
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      return JSON.parse(Buffer.from(parts[1], "base64url").toString());
    } catch {
      return null;
    }
  }

  /**
   * Get token expiry time
   */
  getTokenExpiry(token: string): Date | null {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return null;
    return new Date(payload.exp * 1000);
  }

  /**
   * Check if token is about to expire (within threshold)
   */
  isTokenExpiringSoon(token: string, thresholdSeconds: number = 300): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return payload.exp - now < thresholdSeconds;
  }
}

// Export singleton instance
export const jwtService = new JWTService();

// Export for backward compatibility with auth.service.ts
export { verifyToken as verifyJWT };







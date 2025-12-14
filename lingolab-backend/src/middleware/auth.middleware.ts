import { Request, Response, NextFunction } from "express";
import { jwtService } from "../services/jwt.service";
import { UserRole } from "../entities/User";
import { Messages } from "../constants/messages";

/**
 * Extended Request interface with user info
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

/**
 * JWT Authentication middleware
 * Validates the JWT token in Authorization header
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: Messages.MSG_401,
    });
    return;
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    res.status(401).json({
      success: false,
      message: Messages.MSG_401,
    });
    return;
  }

  const payload = jwtService.verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      message: Messages.MSG_019,
    });
    return;
  }

  // Attach user info to request
  req.user = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role as UserRole,
  };

  next();
}

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't fail if missing
 */
export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    next();
    return;
  }

  const payload = jwtService.verifyAccessToken(token);

  if (payload) {
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role as UserRole,
    };
  }

  next();
}

/**
 * Role-based authorization middleware factory
 * @param allowedRoles Array of roles that are allowed to access the endpoint
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: Messages.MSG_401,
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: Messages.MSG_403,
      });
      return;
    }

    next();
  };
}

/**
 * Require Learner role
 */
export const requireLearner = requireRole(UserRole.LEARNER, UserRole.ADMIN);

/**
 * Require Teacher role
 */
export const requireTeacher = requireRole(UserRole.TEACHER, UserRole.ADMIN);

/**
 * Require Admin role
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Require Teacher or Admin role (for learner management)
 * BR33: Teachers can only view profiles of students assigned to their class
 */
export const requireTeacherOrAdmin = requireRole(UserRole.TEACHER, UserRole.ADMIN);

/**
 * Session expiry check middleware
 * BR16: If session expired, redirect with MSG-019
 */
export function checkSessionExpiry(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: Messages.MSG_019,
      redirect: "/signin",
    });
    return;
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    res.status(401).json({
      success: false,
      message: Messages.MSG_019,
      redirect: "/signin",
    });
    return;
  }

  const payload = jwtService.verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      message: Messages.MSG_019,
      redirect: "/signin",
    });
    return;
  }

  req.user = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role as UserRole,
  };

  next();
}

/**
 * TSOA authentication handler
 * Used by tsoa for @Security decorator
 */
export async function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<{ userId: string; email: string; role: string }> {
  if (securityName === "jwt") {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      throw new Error("Invalid authorization header format");
    }

    const payload = jwtService.verifyAccessToken(token);

    if (!payload) {
      throw new Error("Invalid or expired token");
    }

    // Check role scopes if provided
    if (scopes && scopes.length > 0) {
      const hasRequiredRole = scopes.some((scope) => scope === payload.role);
      if (!hasRequiredRole) {
        throw new Error("Insufficient permissions");
      }
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  }

  throw new Error("Unknown security name");
}


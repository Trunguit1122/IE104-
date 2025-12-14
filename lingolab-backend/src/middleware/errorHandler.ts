import { Request, Response, NextFunction } from "express";
import { ValidateError } from "tsoa";
import { Messages } from "../constants/messages";

export interface ErrorResponse {
  success: false;
  message: string;
  status: number;
  code?: string;
  details?: any;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  code?: string;
  details?: any;

  constructor(status: number, message: string, code?: string, details?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = "ApiError";
  }
}

/**
 * Create common API errors
 */
export const createError = {
  badRequest: (message: string, code?: string, details?: any) =>
    new ApiError(400, message, code, details),
  unauthorized: (message: string = Messages.MSG_401) =>
    new ApiError(401, message, "MSG_401"),
  forbidden: (message: string = Messages.MSG_403) =>
    new ApiError(403, message, "MSG_403"),
  notFound: (message: string = Messages.MSG_404) =>
    new ApiError(404, message, "MSG_404"),
  conflict: (message: string, code?: string) =>
    new ApiError(409, message, code),
  validationError: (message: string, details?: any) =>
    new ApiError(422, message, "VALIDATION_ERROR", details),
  internal: (message: string = Messages.MSG_500) =>
    new ApiError(500, message, "MSG_500"),
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle TSOA validation errors
  if (err instanceof ValidateError) {
    console.warn(`Validation Error for ${req.path}:`, err.fields);
    res.status(422).json({
      success: false,
      message: "Validation Failed",
      status: 422,
      code: "VALIDATION_ERROR",
      details: err.fields,
    });
    return;
  }

  // Handle API errors
  if (err instanceof ApiError) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: err.message,
      status: err.status,
      code: err.code,
    };

    if (process.env.NODE_ENV === "development" && err.details) {
      errorResponse.details = err.details;
    }

    res.status(err.status).json(errorResponse);
    return;
  }

  // Handle authentication errors from TSOA
  if (err.message?.includes("authorization") || err.message?.includes("token")) {
    res.status(401).json({
      success: false,
      message: Messages.MSG_401,
      status: 401,
      code: "MSG_401",
    });
    return;
  }

  // Handle common "not found" errors from services
  if (err.message?.toLowerCase().includes("not found")) {
    res.status(404).json({
      success: false,
      message: err.message,
      status: 404,
      code: "NOT_FOUND",
    });
    return;
  }

  // Handle UUID validation errors
  if (err.message?.includes("invalid input syntax for type uuid") || 
      err.message?.includes("invalid uuid") ||
      err.code === "22P02") {
    res.status(400).json({
      success: false,
      message: "Invalid ID format",
      status: 400,
      code: "INVALID_UUID",
    });
    return;
  }

  // Handle other errors
  const status = err.status || 500;
  const message = status === 500 ? Messages.MSG_500 : err.message || "Internal Server Error";

  console.error(`[Error] ${status} - ${message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  const errorResponse: ErrorResponse = {
    success: false,
    message,
    status,
  };

  if (process.env.NODE_ENV === "development" && err.details) {
    errorResponse.details = err.details;
  }

  res.status(status).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    status: 404,
    code: "ROUTE_NOT_FOUND",
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Message constants as defined in SRS document
 * Following BR (Business Rules) specifications
 */

export const Messages = {
  // Authentication Messages (UC1: Sign Up)
  MSG_001: "Invalid email format. Please enter a valid email address.",
  MSG_002: "This email is already registered. Please use a different email or sign in.",
  MSG_003: "Password must be 8-32 characters and include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
  MSG_004: "Registration successful! Please check your email to verify your account.",
  
  // Authentication Messages (UC2: Sign In)
  MSG_005: "Invalid email or password. Please try again.",
  MSG_006: "Your account is locked or not verified. Please check your email or contact support.",
  MSG_007: "Too many failed attempts. Your account has been locked for 15 minutes.",
  
  // Forgot Password Messages (UC3: Forgot/Reset Password)
  MSG_008: "If the email exists in our system, you will receive a password reset link shortly.",
  MSG_009: "New password cannot be the same as your current password.",
  
  // Profile Messages (UC4: Update Profile)
  MSG_010: "Display name is invalid. It must be 1-50 characters and cannot contain offensive words.",
  MSG_011: "Invalid avatar file. Only .jpg, .png, or .jpeg files under 2MB are allowed.",
  
  // Practice Messages (UC8: Record Audio)
  MSG_012: "Microphone access is required for recording. Please allow microphone permission.",
  MSG_013: "Recording must be at least 30 seconds long. Please record again.",
  MSG_014: "Invalid filename. Use only letters, numbers, hyphens, and underscores (max 50 characters).",
  
  // Submit Messages (UC10: Submit Speaking Attempt)
  MSG_015: "Please select a recording to submit.",
  MSG_016: "Scoring service timed out. Please try again later.",
  MSG_017: "Invalid score. Score must be between 0.0 and 9.0 in 0.5 increments.",
  
  // General Messages
  MSG_018: "Profile updated successfully!",
  MSG_019: "Your session has expired. Please sign in again.",
  MSG_020: "You do not have permission to view this profile.",
  MSG_021: "Report generation timed out. Please try again with a smaller date range.",
  MSG_022: "No data available for the selected date range.",
  
  // Writing Practice Messages (UC20-UC22)
  MSG_023: "You already have an active writing session. Please complete or cancel it first.",
  MSG_024: "Your content has been auto-saved.",
  MSG_025: "Your writing must be at least 250 words for Task 2. Current word count: {count}.",
  MSG_026: "Writing scoring failed. Please try submitting again.",
  
  // AI Scoring Messages (UC23)
  MSG_027: "Scoring failed. Please request re-scoring or contact support.",
  
  // Compare Attempts Messages (UC25)
  MSG_028: "Please select at least 2 attempts to compare.",
  MSG_029: "You can compare a maximum of 5 attempts at once.",
  MSG_030: "You can only compare attempts of the same skill type (Speaking or Writing).",
  
  // Retake Messages (UC26)
  MSG_031: "This prompt is no longer available for practice.",
  
  // Logout Messages (UC27)
  MSG_032: "You have been logged out successfully.",
  
  // Validation Messages
  MSG_033: "Email verification link has expired. Please request a new one.",
  MSG_034: "Password reset link has expired. Please request a new one.",
  MSG_035: "Invalid or expired verification token.",
  MSG_036: "Account verified successfully! You can now sign in.",
  
  // Server Errors
  MSG_500: "An unexpected error occurred. Please try again later.",
  MSG_401: "Unauthorized. Please sign in to continue.",
  MSG_403: "Access denied. You do not have permission to perform this action.",
  MSG_404: "Resource not found.",
} as const;

export type MessageCode = keyof typeof Messages;

/**
 * Get message with parameter substitution
 */
export function getMessage(code: MessageCode, params?: Record<string, string | number>): string {
  let message: string = Messages[code];
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, String(value));
    });
  }
  return message;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  code: MessageCode;
  message: string;
  details?: Record<string, any>;
}

/**
 * Success response structure
 */
export interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data: T;
}

/**
 * Create error response
 */
export function createErrorResponse(
  code: MessageCode,
  params?: Record<string, string | number>,
  details?: Record<string, any>
): ErrorResponse {
  return {
    success: false,
    code,
    message: getMessage(code, params),
    details,
  };
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}


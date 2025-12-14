import { UserRole, UILanguage } from "../entities/User";

/**
 * Auth DTOs following SRS Business Rules
 */

// ============ Sign Up (UC1) ============

/**
 * Sign Up Request DTO
 * BR1: Required fields - email, password, displayName
 * @example {
 *   "email": "learner@example.com",
 *   "password": "SecurePass123!",
 *   "displayName": "John Doe"
 * }
 */
export class SignUpDTO {
  /**
   * User email (BR2: RFC 5322 format, max 255 chars)
   * @isEmail
   */
  email!: string;

  /**
   * User password (BR4: 8-32 chars, 1 uppercase, 1 lowercase, 1 number, 1 special)
   * @minLength 8
   * @maxLength 32
   */
  password!: string;

  /**
   * Display name (BR12: max 50 chars, no offensive words)
   * @maxLength 50
   */
  displayName!: string;

  /**
   * Optional UI language preference
   */
  uiLanguage?: UILanguage;
}

/**
 * Sign Up Response DTO
 */
export class SignUpResponseDTO {
  success!: boolean;
  message!: string;
  userId?: string;
}

// ============ Sign In (UC2) ============

/**
 * Sign In Request DTO
 * @example {
 *   "email": "learner@example.com",
 *   "password": "SecurePass123!"
 * }
 */
export class SignInDTO {
  /**
   * @isEmail
   */
  email!: string;

  password!: string;

  /**
   * Remember me option
   */
  rememberMe?: boolean;
}

/**
 * Sign In Response DTO
 */
export class SignInResponseDTO {
  success!: boolean;
  message!: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: AuthUserDTO;
}

/**
 * Authenticated User DTO
 */
export class AuthUserDTO {
  id!: string;
  email!: string;
  displayName?: string;
  avatarUrl?: string;
  role!: UserRole;
  uiLanguage!: UILanguage;
}

// ============ Email Verification ============

/**
 * Verify Email Request DTO
 */
export class VerifyEmailDTO {
  token!: string;
}

/**
 * Resend Verification Email DTO
 */
export class ResendVerificationDTO {
  /**
   * @isEmail
   */
  email!: string;
}

// ============ Forgot/Reset Password (UC3) ============

/**
 * Forgot Password Request DTO
 * BR9: Always show same message regardless of email existence
 * @example {
 *   "email": "learner@example.com"
 * }
 */
export class ForgotPasswordDTO {
  /**
   * @isEmail
   */
  email!: string;
}

/**
 * Reset Password Request DTO
 * BR10: Token valid for 15 minutes, single use
 * BR11: New password cannot be same as current
 * @example {
 *   "token": "reset_token_here",
 *   "newPassword": "NewSecurePass456!"
 * }
 */
export class ResetPasswordDTO {
  token!: string;

  /**
   * @minLength 8
   * @maxLength 32
   */
  newPassword!: string;
}

/**
 * Change Password Request DTO (for logged-in users)
 */
export class ChangePasswordDTO {
  currentPassword!: string;

  /**
   * @minLength 8
   * @maxLength 32
   */
  newPassword!: string;
}

// ============ Token Refresh ============

/**
 * Refresh Token Request DTO
 */
export class RefreshTokenDTO {
  refreshToken!: string;
}

/**
 * Token Response DTO
 */
export class TokenResponseDTO {
  accessToken!: string;
  refreshToken!: string;
  expiresIn!: number;
}

// ============ Logout (UC27) ============

/**
 * Logout Request DTO
 * BR64: No confirmation required
 * BR65: Server invalidates JWT/refresh token
 * BR66: Clear local/session storage (client-side)
 */
export class LogoutDTO {
  refreshToken?: string;
}

export class LogoutResponseDTO {
  success!: boolean;
  message!: string;
}

// ============ Profile Update (UC4) ============

/**
 * Update Profile Request DTO
 * BR12: Display name validation
 * BR13: Avatar constraints
 * @example {
 *   "displayName": "John Doe",
 *   "uiLanguage": "en"
 * }
 */
export class UpdateProfileDTO {
  /**
   * Display name (BR12: max 50 chars, no offensive words)
   * @maxLength 50
   */
  displayName?: string;

  /**
   * Avatar URL (set after upload)
   */
  avatarUrl?: string;

  /**
   * UI language preference
   */
  uiLanguage?: UILanguage;
}

/**
 * Update Profile Response DTO
 */
export class UpdateProfileResponseDTO {
  success!: boolean;
  message!: string;
  user?: AuthUserDTO;
}

// ============ Session Info ============

/**
 * Current Session DTO
 */
export class SessionDTO {
  userId!: string;
  email!: string;
  role!: UserRole;
  issuedAt!: number;
  expiresAt!: number;
}

/**
 * JWT Payload structure
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}


import * as bcrypt from "bcrypt";
import { AppDataSource } from "../data-source";
import { User, UserRole, UserStatus, UILanguage } from "../entities/User";
import { LearnerProfile } from "../entities/LearnerProfile";
import {
  SignUpDTO,
  SignUpResponseDTO,
  SignInDTO,
  SignInResponseDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
  RefreshTokenDTO,
  TokenResponseDTO,
  AuthUserDTO,
  UpdateProfileDTO,
  UpdateProfileResponseDTO,
  JWTPayload,
} from "../dtos/auth.dto";
import { Messages, getMessage } from "../constants/messages";
import {
  isValidEmail,
  isValidPassword,
  isValidDisplayName,
  generateToken,
  isTokenExpired,
} from "../utils/validation.utils";
import { emailService } from "./email.service";
import { auditService } from "./audit.service";
import { AuditAction } from "../entities/AuditLog";
import { jwtService } from "./jwt.service";

// Constants for lockout policy (BR8)
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 10;
const LOCKOUT_DURATION_MINUTES = 15;

// Token expiry times
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const VERIFICATION_TOKEN_EXPIRY_MINUTES = 15; // BR10
const RESET_TOKEN_EXPIRY_MINUTES = 15; // BR10

// Bcrypt salt rounds (Security requirement)
const BCRYPT_SALT_ROUNDS = 12;

/**
 * Password hashing using Bcrypt (as per Security Rules in SRS)
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// JWT functions are now handled by jwtService
// Legacy createJWT/verifyJWT removed - use jwtService instead

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private learnerProfileRepository = AppDataSource.getRepository(LearnerProfile);

  /**
   * UC1: Sign Up
   * BR1-BR5: Required fields, email format, email uniqueness, password complexity
   */
  async signUp(dto: SignUpDTO): Promise<SignUpResponseDTO> {
    // BR2: Validate email format
    if (!isValidEmail(dto.email)) {
      return {
        success: false,
        message: Messages.MSG_001,
      };
    }

    // BR3: Check email uniqueness (case-insensitive)
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingUser) {
      return {
        success: false,
        message: Messages.MSG_002,
      };
    }

    // BR4: Validate password complexity
    if (!isValidPassword(dto.password)) {
      return {
        success: false,
        message: Messages.MSG_003,
      };
    }

    // BR12: Validate display name
    if (!isValidDisplayName(dto.displayName)) {
      return {
        success: false,
        message: Messages.MSG_010,
      };
    }

    // Generate verification token (BR5)
    const verificationToken = generateToken(64);
    const verificationTokenExpiry = new Date(
      Date.now() + VERIFICATION_TOKEN_EXPIRY_MINUTES * 60 * 1000
    );

    // Hash password using Bcrypt (Security requirement)
    const hashedPassword = await hashPassword(dto.password);

    // Create user with PendingVerify status (BR5)
    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      displayName: dto.displayName,
      role: UserRole.LEARNER,
      status: UserStatus.PENDING_VERIFY,
      uiLanguage: dto.uiLanguage || UILanguage.EN,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    const savedUser = await this.userRepository.save(user);

    // Create learner profile
    const learnerProfile = this.learnerProfileRepository.create({
      userId: savedUser.id,
    });
    await this.learnerProfileRepository.save(learnerProfile);

    // Send verification email (BR5)
    await emailService.sendVerificationEmail(
      savedUser.email,
      savedUser.displayName || savedUser.email,
      verificationToken
    );

    return {
      success: true,
      message: Messages.MSG_004,
      userId: savedUser.id,
    };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({
      where: { verificationToken: token },
    });

    if (!user) {
      return {
        success: false,
        message: Messages.MSG_035,
      };
    }

    if (isTokenExpired(user.verificationTokenExpiry)) {
      return {
        success: false,
        message: Messages.MSG_033,
      };
    }

    // Update user status
    await this.userRepository.update(user.id, {
      emailVerified: true,
      status: UserStatus.ACTIVE,
      verificationToken: undefined,
      verificationTokenExpiry: undefined,
    });

    return {
      success: true,
      message: Messages.MSG_036,
    };
  }

  /**
   * UC2: Sign In
   * BR6-BR8: Credential validation, status check, lockout policy
   * UC2 Postcondition: Log LoginSuccess/LoginFailed
   */
  async signIn(
    dto: SignInDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SignInResponseDTO> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    // BR6: Check if user exists
    if (!user) {
      // Audit: Log failed login - user not found
      await auditService.logLoginFailed(
        dto.email,
        "User not found",
        ipAddress,
        userAgent
      );
      return {
        success: false,
        message: Messages.MSG_005,
      };
    }

    // BR8: Check lockout
    if (user.lockoutUntil && new Date() < user.lockoutUntil) {
      // Audit: Log failed login - account locked
      await auditService.logLoginFailed(
        dto.email,
        "Account locked",
        ipAddress,
        userAgent,
        user.id
      );
      return {
        success: false,
        message: Messages.MSG_007,
      };
    }

    // Reset lockout if expired
    if (user.lockoutUntil && new Date() >= user.lockoutUntil) {
      await this.userRepository.update(user.id, {
        lockoutUntil: undefined,
        failedLoginAttempts: 0,
      });
      user.failedLoginAttempts = 0;
      user.lockoutUntil = undefined;
    }

    // BR6: Verify password
    if (!(await verifyPassword(dto.password, user.password))) {
      // BR8: Increment failed attempts
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const now = new Date();

      // Check if within lockout window
      const windowStart = new Date(now.getTime() - LOCKOUT_WINDOW_MINUTES * 60 * 1000);
      const shouldResetCounter =
        user.lastFailedLoginAt && user.lastFailedLoginAt < windowStart;

      if (shouldResetCounter) {
        await this.userRepository.update(user.id, {
          failedLoginAttempts: 1,
          lastFailedLoginAt: now,
        });
        // Audit: Log failed login - invalid password
        await auditService.logLoginFailed(
          dto.email,
          "Invalid password",
          ipAddress,
          userAgent,
          user.id
        );
      } else if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        // Lock account for 15 minutes
        const lockoutUntil = new Date(now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        await this.userRepository.update(user.id, {
          failedLoginAttempts: newFailedAttempts,
          lastFailedLoginAt: now,
          lockoutUntil,
        });
        // Audit: Log account locked
        await auditService.logAccountLocked(
          user.id,
          user.email,
          newFailedAttempts,
          ipAddress,
          userAgent
        );
        return {
          success: false,
          message: Messages.MSG_007,
        };
      } else {
        await this.userRepository.update(user.id, {
          failedLoginAttempts: newFailedAttempts,
          lastFailedLoginAt: now,
        });
        // Audit: Log failed login - invalid password
        await auditService.logLoginFailed(
          dto.email,
          `Invalid password (attempt ${newFailedAttempts}/${MAX_FAILED_ATTEMPTS})`,
          ipAddress,
          userAgent,
          user.id
        );
      }

      return {
        success: false,
        message: Messages.MSG_005,
      };
    }

    // BR7: Check account status
    if (user.status === UserStatus.LOCKED) {
      // Audit: Log failed login - account status
      await auditService.logLoginFailed(
        dto.email,
        "Account is locked",
        ipAddress,
        userAgent,
        user.id
      );
      return {
        success: false,
        message: Messages.MSG_006,
      };
    }

    if (user.status === UserStatus.PENDING_VERIFY || !user.emailVerified) {
      // Audit: Log failed login - email not verified
      await auditService.logLoginFailed(
        dto.email,
        "Email not verified",
        ipAddress,
        userAgent,
        user.id
      );
      return {
        success: false,
        message: Messages.MSG_006,
      };
    }

    // Generate tokens using JWT service
    const tokenPair = jwtService.createTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Reset failed attempts and store refresh token on successful login
    await this.userRepository.update(user.id, {
      failedLoginAttempts: 0,
      lastFailedLoginAt: undefined,
      lastLoginAt: new Date(),
      refreshToken: tokenPair.refreshToken,
      refreshTokenExpiry: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    });

    // Audit: Log successful login (UC2 Postcondition)
    await auditService.logLoginSuccess(user.id, user.email, ipAddress, userAgent);

    return {
      success: true,
      message: "Login successful",
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        uiLanguage: user.uiLanguage,
      },
    };
  }

  /**
   * UC3: Forgot Password
   * BR9: Always show same message (security)
   */
  async forgotPassword(dto: ForgotPasswordDTO): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    // BR9: Always return same message regardless of whether email exists
    const response = {
      success: true,
      message: Messages.MSG_008,
    };

    if (!user) {
      return response;
    }

    // Generate reset token (BR10: valid for 15 minutes)
    const resetToken = generateToken(64);
    const resetExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await this.userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetExpiry,
    });

    // Send password reset email (BR9-11)
    await emailService.sendPasswordResetEmail(
      user.email,
      user.displayName || user.email,
      resetToken
    );

    return response;
  }

  /**
   * UC3: Reset Password
   * BR10: Token valid for 15 minutes, single use
   * BR11: New password cannot be same as current
   */
  async resetPassword(dto: ResetPasswordDTO): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: dto.token },
    });

    if (!user) {
      return {
        success: false,
        message: Messages.MSG_035,
      };
    }

    // BR10: Check token expiry
    if (isTokenExpired(user.passwordResetExpiry)) {
      return {
        success: false,
        message: Messages.MSG_034,
      };
    }

    // BR4: Validate new password
    if (!isValidPassword(dto.newPassword)) {
      return {
        success: false,
        message: Messages.MSG_003,
      };
    }

    // BR11: Check if new password is same as current
    if (await verifyPassword(dto.newPassword, user.password)) {
      return {
        success: false,
        message: Messages.MSG_009,
      };
    }

    // Update password and clear reset token
    const newHashedPassword = await hashPassword(dto.newPassword);
    await this.userRepository.update(user.id, {
      password: newHashedPassword,
      passwordResetToken: undefined,
      passwordResetExpiry: undefined,
      // Invalidate all sessions on password change
      refreshToken: undefined,
      refreshTokenExpiry: undefined,
    });

    return {
      success: true,
      message: "Password reset successfully",
    };
  }

  /**
   * Change password for logged-in user
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDTO
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return {
        success: false,
        message: Messages.MSG_404,
      };
    }

    // Verify current password
    if (!(await verifyPassword(dto.currentPassword, user.password))) {
      return {
        success: false,
        message: Messages.MSG_005,
      };
    }

    // BR4: Validate new password
    if (!isValidPassword(dto.newPassword)) {
      return {
        success: false,
        message: Messages.MSG_003,
      };
    }

    // BR11: Check if new password is same as current
    if (await verifyPassword(dto.newPassword, user.password)) {
      return {
        success: false,
        message: Messages.MSG_009,
      };
    }

    // Update password
    const changedHashedPassword = await hashPassword(dto.newPassword);
    await this.userRepository.update(userId, {
      password: changedHashedPassword,
    });

    return {
      success: true,
      message: "Password changed successfully",
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(dto: RefreshTokenDTO): Promise<TokenResponseDTO | null> {
    const user = await this.userRepository.findOne({
      where: { refreshToken: dto.refreshToken },
    });

    if (!user) {
      return null;
    }

    if (isTokenExpired(user.refreshTokenExpiry)) {
      return null;
    }

    // Blacklist old refresh token
    jwtService.blacklistToken(dto.refreshToken);

    // Generate new token pair using JWT service
    const tokenPair = jwtService.createTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Update refresh token in database
    await this.userRepository.update(user.id, {
      refreshToken: tokenPair.refreshToken,
      refreshTokenExpiry: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
    };
  }

  /**
   * UC27: Logout
   * BR65: Invalidate JWT/refresh token
   */
  async logout(
    userId: string,
    accessToken?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string }> {
    // Get current refresh token before clearing
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    // Blacklist access token if provided (immediate invalidation)
    if (accessToken) {
      jwtService.blacklistToken(accessToken);
    }
    
    // Blacklist refresh token if exists
    if (user?.refreshToken) {
      jwtService.blacklistToken(user.refreshToken);
    }

    // Clear refresh token from database
    await this.userRepository.update(userId, {
      refreshToken: undefined,
      refreshTokenExpiry: undefined,
    });

    // Audit: Log logout
    await auditService.logLogout(userId, ipAddress, userAgent);

    return {
      success: true,
      message: Messages.MSG_032,
    };
  }

  /**
   * UC4: Update Profile
   * BR12: Display name validation
   * BR13: Avatar validation (handled at upload)
   * BR14: Success message
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDTO
  ): Promise<UpdateProfileResponseDTO> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return {
        success: false,
        message: Messages.MSG_404,
      };
    }

    // BR12: Validate display name
    if (dto.displayName !== undefined && !isValidDisplayName(dto.displayName)) {
      return {
        success: false,
        message: Messages.MSG_010,
      };
    }

    const updateData: Partial<User> = {};
    if (dto.displayName !== undefined) updateData.displayName = dto.displayName;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;
    if (dto.uiLanguage !== undefined) updateData.uiLanguage = dto.uiLanguage;

    await this.userRepository.update(userId, updateData);

    const updatedUser = await this.userRepository.findOne({ where: { id: userId } });

    return {
      success: true,
      message: Messages.MSG_018,
      user: updatedUser
        ? {
            id: updatedUser.id,
            email: updatedUser.email,
            displayName: updatedUser.displayName,
            avatarUrl: updatedUser.avatarUrl,
            role: updatedUser.role,
            uiLanguage: updatedUser.uiLanguage,
          }
        : undefined,
    };
  }

  /**
   * Get current user from JWT payload
   */
  async getCurrentUser(userId: string): Promise<AuthUserDTO | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      uiLanguage: user.uiLanguage,
    };
  }

  /**
   * Validate JWT token and return payload
   */
  validateToken(token: string): JWTPayload | null {
    const payload = jwtService.verifyAccessToken(token);
    if (!payload) return null;
    return {
      ...payload,
      role: payload.role as UserRole,
    };
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.emailVerified) {
      // Don't reveal if user exists
      return {
        success: true,
        message: "If the email exists and is not verified, a new verification link has been sent.",
      };
    }

    // Generate new verification token
    const verificationToken = generateToken(64);
    const verificationTokenExpiry = new Date(
      Date.now() + VERIFICATION_TOKEN_EXPIRY_MINUTES * 60 * 1000
    );

    await this.userRepository.update(user.id, {
      verificationToken,
      verificationTokenExpiry,
    });

    // Send verification email
    await emailService.sendVerificationEmail(
      user.email,
      user.displayName || user.email,
      verificationToken
    );

    return {
      success: true,
      message: "If the email exists and is not verified, a new verification link has been sent.",
    };
  }
}


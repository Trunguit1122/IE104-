import {
  Controller,
  Post,
  Get,
  Put,
  Route,
  Body,
  Query,
  Response,
  Tags,
  Security,
  Request,
} from "tsoa";
import { Request as ExpressRequest } from "express";
import { AuthService } from "../services/auth.service";
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
  LogoutResponseDTO,
  UpdateProfileDTO,
  UpdateProfileResponseDTO,
  AuthUserDTO,
  VerifyEmailDTO,
  ResendVerificationDTO,
} from "../dtos/auth.dto";
import { Messages } from "../constants/messages";

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

@Route("/api/auth")
@Tags("Authentication")
export class AuthController extends Controller {
  private authService = new AuthService();

  /**
   * UC1: Sign Up - Create a new user account
   * BR1-BR5: Required fields, email format, email uniqueness, password complexity
   */
  @Post("signup")
  @Response<SignUpResponseDTO>(201, "Registration successful")
  @Response(400, "Validation error")
  async signUp(@Body() dto: SignUpDTO): Promise<SignUpResponseDTO> {
    const result = await this.authService.signUp(dto);
    if (result.success) {
      this.setStatus(201);
    } else {
      this.setStatus(400);
    }
    return result;
  }

  /**
   * UC2: Sign In - Authenticate user
   * BR6-BR8: Credential validation, status check, lockout policy
   */
  @Post("signin")
  @Response<SignInResponseDTO>(200, "Login successful")
  @Response(400, "Invalid credentials")
  @Response(403, "Account locked or not verified")
  async signIn(
    @Request() request: AuthenticatedRequest,
    @Body() dto: SignInDTO
  ): Promise<SignInResponseDTO> {
    // Get IP and User-Agent for audit logging
    const ipAddress = request.ip || request.headers["x-forwarded-for"]?.toString().split(",")[0];
    const userAgent = request.headers["user-agent"];

    const result = await this.authService.signIn(dto, ipAddress, userAgent);
    if (!result.success) {
      if (result.message === Messages.MSG_007 || result.message === Messages.MSG_006) {
        this.setStatus(403);
      } else {
        this.setStatus(400);
      }
    }
    return result;
  }

  /**
   * Verify email address with token
   */
  @Post("verify-email")
  @Response(200, "Email verified successfully")
  @Response(400, "Invalid or expired token")
  async verifyEmail(@Body() dto: VerifyEmailDTO): Promise<{ success: boolean; message: string }> {
    const result = await this.authService.verifyEmail(dto.token);
    if (!result.success) {
      this.setStatus(400);
    }
    return result;
  }

  /**
   * Resend verification email
   */
  @Post("resend-verification")
  @Response(200, "Verification email sent")
  async resendVerification(
    @Body() dto: ResendVerificationDTO
  ): Promise<{ success: boolean; message: string }> {
    return await this.authService.resendVerification(dto.email);
  }

  /**
   * UC3: Forgot Password - Request password reset link
   * BR9: Always show same message for security
   */
  @Post("forgot-password")
  @Response(200, "Reset email sent if account exists")
  async forgotPassword(
    @Body() dto: ForgotPasswordDTO
  ): Promise<{ success: boolean; message: string }> {
    return await this.authService.forgotPassword(dto);
  }

  /**
   * UC3: Reset Password - Set new password with token
   * BR10: Token valid for 15 minutes
   * BR11: New password cannot be same as current
   */
  @Post("reset-password")
  @Response(200, "Password reset successful")
  @Response(400, "Invalid token or password")
  async resetPassword(
    @Body() dto: ResetPasswordDTO
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.authService.resetPassword(dto);
    if (!result.success) {
      this.setStatus(400);
    }
    return result;
  }

  /**
   * Change password for authenticated user
   */
  @Post("change-password")
  @Security("jwt")
  @Response(200, "Password changed successfully")
  @Response(400, "Invalid current password or new password")
  @Response(401, "Unauthorized")
  async changePassword(
    @Request() request: AuthenticatedRequest,
    @Body() dto: ChangePasswordDTO
  ): Promise<{ success: boolean; message: string }> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const result = await this.authService.changePassword(userId, dto);
    if (!result.success) {
      this.setStatus(400);
    }
    return result;
  }

  /**
   * Refresh access token using refresh token
   */
  @Post("refresh-token")
  @Response<TokenResponseDTO>(200, "Token refreshed")
  @Response(401, "Invalid or expired refresh token")
  async refreshToken(@Body() dto: RefreshTokenDTO): Promise<TokenResponseDTO | { success: boolean; message: string }> {
    const result = await this.authService.refreshToken(dto);
    if (!result) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_019 };
    }
    return result;
  }

  /**
   * UC27: Logout - Invalidate session
   * BR64: No confirmation required
   * BR65: Invalidate JWT/refresh token (both access and refresh tokens blacklisted)
   */
  @Post("logout")
  @Security("jwt")
  @Response<LogoutResponseDTO>(200, "Logged out successfully")
  @Response(401, "Unauthorized")
  async logout(@Request() request: AuthenticatedRequest): Promise<LogoutResponseDTO> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    // Extract access token from header to blacklist it
    const authHeader = request.headers.authorization;
    const accessToken = authHeader?.split(" ")[1];

    // Get IP and User-Agent for audit
    const ipAddress = request.ip || request.headers["x-forwarded-for"]?.toString().split(",")[0];
    const userAgent = request.headers["user-agent"];

    return await this.authService.logout(userId, accessToken, ipAddress, userAgent);
  }

  /**
   * Get current user profile
   */
  @Get("me")
  @Security("jwt")
  @Response<AuthUserDTO>(200, "User profile")
  @Response(401, "Unauthorized")
  async getCurrentUser(@Request() request: AuthenticatedRequest): Promise<AuthUserDTO | { success: boolean; message: string }> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const user = await this.authService.getCurrentUser(userId);
    if (!user) {
      this.setStatus(404);
      return { success: false, message: Messages.MSG_404 };
    }

    return user;
  }

  /**
   * UC4: Update Profile
   * BR12: Display name validation
   * BR13: Avatar validation
   * BR14: Success message
   */
  @Put("profile")
  @Security("jwt")
  @Response<UpdateProfileResponseDTO>(200, "Profile updated")
  @Response(400, "Validation error")
  @Response(401, "Unauthorized")
  async updateProfile(
    @Request() request: AuthenticatedRequest,
    @Body() dto: UpdateProfileDTO
  ): Promise<UpdateProfileResponseDTO> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const result = await this.authService.updateProfile(userId, dto);
    if (!result.success) {
      this.setStatus(400);
    }
    return result;
  }
}


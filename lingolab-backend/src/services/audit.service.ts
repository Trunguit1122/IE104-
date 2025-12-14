import { AppDataSource } from "../data-source";
import { AuditLog, AuditAction } from "../entities/AuditLog";

/**
 * Audit Service
 * Handles logging of all important user actions for security and compliance
 * 
 * SRS Requirement: UC2 Postcondition - Log login attempts
 */

export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  success?: boolean;
  errorMessage?: string;
}

export class AuditService {
  private auditLogRepository = AppDataSource.getRepository(AuditLog);

  /**
   * Log an audit entry
   */
  async log(entry: AuditLogEntry): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      metadata: entry.metadata,
      success: entry.success ?? true,
      errorMessage: entry.errorMessage,
    });

    return await this.auditLogRepository.save(auditLog);
  }

  /**
   * Log successful login (UC2 Postcondition)
   */
  async logLoginSuccess(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: AuditAction.LOGIN_SUCCESS,
      entityType: "User",
      entityId: userId,
      ipAddress,
      userAgent,
      metadata: { email },
      success: true,
    });
  }

  /**
   * Log failed login attempt (UC2 Postcondition)
   */
  async logLoginFailed(
    email: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
    userId?: string
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: AuditAction.LOGIN_FAILED,
      entityType: "User",
      entityId: userId,
      ipAddress,
      userAgent,
      metadata: { email, reason },
      success: false,
      errorMessage: reason,
    });
  }

  /**
   * Log account lockout (BR8)
   */
  async logAccountLocked(
    userId: string,
    email: string,
    failedAttempts: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: AuditAction.ACCOUNT_LOCKED,
      entityType: "User",
      entityId: userId,
      ipAddress,
      userAgent,
      metadata: { email, failedAttempts, lockoutDurationMinutes: 15 },
      success: true,
    });
  }

  /**
   * Log logout
   */
  async logLogout(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: AuditAction.LOGOUT,
      entityType: "User",
      entityId: userId,
      ipAddress,
      userAgent,
      success: true,
    });
  }

  /**
   * Log password reset request
   */
  async logPasswordResetRequest(
    email: string,
    ipAddress?: string,
    userAgent?: string,
    userId?: string
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: AuditAction.PASSWORD_RESET_REQUEST,
      entityType: "User",
      entityId: userId,
      ipAddress,
      userAgent,
      metadata: { email },
      success: true,
    });
  }

  /**
   * Log password reset success
   */
  async logPasswordResetSuccess(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: AuditAction.PASSWORD_RESET_SUCCESS,
      entityType: "User",
      entityId: userId,
      ipAddress,
      userAgent,
      success: true,
    });
  }

  /**
   * Log password change
   */
  async logPasswordChange(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: AuditAction.PASSWORD_CHANGE,
      entityType: "User",
      entityId: userId,
      ipAddress,
      userAgent,
      success: true,
    });
  }

  /**
   * Log email verification
   */
  async logEmailVerification(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: AuditAction.EMAIL_VERIFICATION,
      entityType: "User",
      entityId: userId,
      ipAddress,
      userAgent,
      metadata: { email },
      success: true,
    });
  }

  /**
   * Log teacher evaluation (BR38)
   */
  async logTeacherEvaluation(
    teacherId: string,
    attemptId: string,
    learnerId: string,
    score?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.log({
      userId: teacherId,
      action: AuditAction.TEACHER_EVALUATION,
      entityType: "Attempt",
      entityId: attemptId,
      ipAddress,
      userAgent,
      metadata: { learnerId, score },
      success: true,
    });
  }

  /**
   * Log report export (BR42-45)
   */
  async logReportExport(
    teacherId: string,
    learnerId: string,
    format: string,
    fileName: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.log({
      userId: teacherId,
      action: AuditAction.REPORT_EXPORT,
      entityType: "User",
      entityId: learnerId,
      ipAddress,
      userAgent,
      metadata: { learnerId, format, fileName },
      success: true,
    });
  }

  /**
   * Get audit logs for a user
   */
  async getLogsForUser(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const [logs, total] = await this.auditLogRepository.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit,
      skip: offset,
    });
    return { logs, total };
  }

  /**
   * Get login history for a user
   */
  async getLoginHistory(
    userId: string,
    limit: number = 10
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: [
        { userId, action: AuditAction.LOGIN_SUCCESS },
        { userId, action: AuditAction.LOGIN_FAILED },
      ],
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  /**
   * Get failed login attempts from an IP address (for rate limiting analysis)
   */
  async getFailedLoginsFromIP(
    ipAddress: string,
    withinMinutes: number = 15
  ): Promise<number> {
    const since = new Date(Date.now() - withinMinutes * 60 * 1000);
    
    return this.auditLogRepository
      .createQueryBuilder("log")
      .where("log.action = :action", { action: AuditAction.LOGIN_FAILED })
      .andWhere("log.ipAddress = :ipAddress", { ipAddress })
      .andWhere("log.createdAt >= :since", { since })
      .getCount();
  }

  /**
   * Get recent security events (for admin dashboard)
   */
  async getSecurityEvents(limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: [
        { action: AuditAction.LOGIN_FAILED },
        { action: AuditAction.ACCOUNT_LOCKED },
        { action: AuditAction.PASSWORD_RESET_REQUEST },
        { action: AuditAction.PASSWORD_CHANGE },
      ],
      relations: ["user"],
      order: { createdAt: "DESC" },
      take: limit,
    });
  }
}

// Export singleton instance
export const auditService = new AuditService();







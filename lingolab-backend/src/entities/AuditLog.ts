import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

/**
 * Audit Action Types
 * UC2 Postcondition: Log LoginSuccess/LoginFailed
 */
export enum AuditAction {
  // Authentication actions
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  PASSWORD_RESET_REQUEST = "PASSWORD_RESET_REQUEST",
  PASSWORD_RESET_SUCCESS = "PASSWORD_RESET_SUCCESS",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  
  // User actions
  PROFILE_UPDATE = "PROFILE_UPDATE",
  AVATAR_UPLOAD = "AVATAR_UPLOAD",
  
  // Practice actions
  ATTEMPT_START = "ATTEMPT_START",
  ATTEMPT_SUBMIT = "ATTEMPT_SUBMIT",
  ATTEMPT_SCORED = "ATTEMPT_SCORED",
  
  // Teacher actions
  TEACHER_EVALUATION = "TEACHER_EVALUATION",
  REPORT_EXPORT = "REPORT_EXPORT",
  
  // Admin actions
  USER_CREATE = "USER_CREATE",
  USER_UPDATE = "USER_UPDATE",
  USER_DELETE = "USER_DELETE",
  USER_LOCK = "USER_LOCK",
  USER_UNLOCK = "USER_UNLOCK",
}

/**
 * Audit Log Entity
 * Tracks all important user actions for security and compliance
 * 
 * SRS Requirement: UC2 Postcondition - Log login attempts
 */
@Entity("audit_logs")
@Index(["userId", "createdAt"])
@Index(["action", "createdAt"])
@Index(["ipAddress", "createdAt"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * User who performed the action (nullable for failed logins with unknown user)
   */
  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user?: User;

  /**
   * Action type
   */
  @Column({
    type: "enum",
    enum: AuditAction,
  })
  action!: AuditAction;

  /**
   * Target entity type (e.g., "User", "Attempt", "Score")
   */
  @Column({ type: "varchar", length: 50, nullable: true })
  entityType?: string;

  /**
   * Target entity ID
   */
  @Column({ type: "uuid", nullable: true })
  entityId?: string;

  /**
   * IP address of the request
   */
  @Column({ type: "varchar", length: 45, nullable: true })
  ipAddress?: string;

  /**
   * User agent string
   */
  @Column({ type: "text", nullable: true })
  userAgent?: string;

  /**
   * Additional metadata (JSON)
   * e.g., { email: "user@example.com", reason: "Invalid password" }
   */
  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  /**
   * Whether the action was successful
   */
  @Column({ type: "boolean", default: true })
  success!: boolean;

  /**
   * Error message if action failed
   */
  @Column({ type: "text", nullable: true })
  errorMessage?: string;

  /**
   * Timestamp
   */
  @CreateDateColumn()
  createdAt!: Date;
}







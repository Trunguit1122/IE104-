import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToMany,
  Index,
} from "typeorm";
import { LearnerProfile } from "./LearnerProfile";
import { Attempt } from "./Attempt";
import { Prompt } from "./Prompt";
import { Feedback } from "./Feedback";
import { Class } from "./Class";

export enum UserRole {
  LEARNER = "learner",
  TEACHER = "teacher",
  ADMIN = "admin",
}

export enum UserStatus {
  PENDING_VERIFY = "pending_verify",
  ACTIVE = "active",
  LOCKED = "locked",
}

export enum UILanguage {
  VI = "vi",
  EN = "en",
}

@Entity("users")
@Index("idx_user_email", ["email"], { unique: true })
@Index("idx_user_verification_token", ["verificationToken"])
@Index("idx_user_reset_token", ["passwordResetToken"])
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar" })
  password!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  displayName?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  avatarUrl?: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.LEARNER,
  })
  role!: UserRole;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFY,
  })
  status!: UserStatus;

  @Column({
    type: "enum",
    enum: UILanguage,
    default: UILanguage.EN,
  })
  uiLanguage!: UILanguage;

  // Email verification (BR5)
  @Column({ type: "boolean", default: false })
  emailVerified!: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  verificationToken?: string;

  @Column({ type: "timestamp", nullable: true })
  verificationTokenExpiry?: Date;

  // Password reset (BR9-BR11)
  @Column({ type: "varchar", length: 255, nullable: true })
  passwordResetToken?: string;

  @Column({ type: "timestamp", nullable: true })
  passwordResetExpiry?: Date;

  // Lockout policy (BR8)
  @Column({ type: "integer", default: 0 })
  failedLoginAttempts!: number;

  @Column({ type: "timestamp", nullable: true })
  lastFailedLoginAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  lockoutUntil?: Date;

  // Session management (BR65)
  @Column({ type: "varchar", length: 500, nullable: true })
  refreshToken?: string;

  @Column({ type: "timestamp", nullable: true })
  refreshTokenExpiry?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  lastLoginAt?: Date;

  // Relations
  @OneToOne(() => LearnerProfile, (profile) => profile.user, {
    cascade: true,
    onDelete: "CASCADE",
  })
  learnerProfile?: LearnerProfile;

  @OneToMany(() => Attempt, (attempt) => attempt.learner)
  attempts?: Attempt[];

  @OneToMany(() => Prompt, (prompt) => prompt.createdBy)
  prompts?: Prompt[];

  @OneToMany(() => Feedback, (feedback) => feedback.author)
  feedbacks?: Feedback[];

  @OneToMany(() => Class, (classs) => classs.teacher)
  taughtClasses?: Class[];

  @ManyToMany(() => Class, (classs) => classs.learners, {
    onDelete: "CASCADE",
  })
  enrolledClasses?: Class[];
}

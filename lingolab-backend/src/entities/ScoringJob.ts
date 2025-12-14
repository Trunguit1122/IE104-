import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Attempt } from "./Attempt";

export enum ScoringJobStatus {
  QUEUED = "queued",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

@Entity("scoring_jobs")
@Index("idx_scoring_jobs_status_created", ["status", "createdAt"])
export class ScoringJob {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "enum",
    enum: ScoringJobStatus,
    default: ScoringJobStatus.QUEUED,
  })
  status!: ScoringJobStatus;

  @Column({ type: "text", nullable: true })
  errorMessage?: string;

  @Column({ type: "integer", default: 0 })
  retryCount!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  startedAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  completedAt?: Date;

  // Explicit attemptId column for direct access
  @Column({ name: "attempt_id", type: "uuid" })
  attemptId!: string;

  // Relations
  @Index("idx_scoring_job_attempt", { unique: true })
  @OneToOne(() => Attempt, (attempt) => attempt.scoringJob, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "attempt_id" })
  attempt!: Attempt;
}

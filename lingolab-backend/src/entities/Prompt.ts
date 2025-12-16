import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User";
import { Attempt } from "./Attempt";
import { Topic } from "./Topic";

export enum SkillType {
  SPEAKING = "speaking",
  WRITING = "writing",
}

export enum DifficultyLevel {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export enum WritingTaskType {
  TASK_1 = "task_1",
  TASK_2 = "task_2",
}

@Entity("prompts")
@Index("idx_prompts_skill_difficulty", ["skillType", "difficulty"])
@Index("idx_prompts_created_by", ["createdBy"])
@Index("idx_prompts_topic", ["topicId"])
@Index("idx_prompts_active", ["isActive"])
export class Prompt {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  createdBy!: string;

  @Column({ name: "topic_id", type: "uuid", nullable: true })
  topicId?: string;

  @Column({
    type: "enum",
    enum: SkillType,
  })
  skillType!: SkillType;

  @Column({ type: "text" })
  content!: string;

  @Column({
    type: "enum",
    enum: DifficultyLevel,
  })
  difficulty!: DifficultyLevel;

  @Column({ type: "integer", comment: "Prep time in seconds" })
  prepTime!: number;

  @Column({ type: "integer", comment: "Response time in seconds" })
  responseTime!: number;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "text", nullable: true })
  followUpQuestions?: string;

  // Writing-specific fields (BR47)
  @Column({
    type: "enum",
    enum: WritingTaskType,
    nullable: true,
  })
  writingTaskType?: WritingTaskType;

  @Column({ type: "integer", nullable: true, comment: "Minimum word count for writing" })
  minWordCount?: number;

  @Column({ type: "integer", nullable: true, comment: "Maximum word count for writing" })
  maxWordCount?: number;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.prompts, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "created_by" })
  creator!: User;

  @ManyToOne(() => Topic, (topic) => topic.prompts, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "topic_id" })
  topic?: Topic;

  @OneToMany(() => Attempt, (attempt) => attempt.prompt)
  attempts?: Attempt[];
}

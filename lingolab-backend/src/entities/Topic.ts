import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { Prompt } from "./Prompt";

@Entity("topics")
@Index("idx_topic_name", ["name"])
export class Topic {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  icon?: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "integer", default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Relations
  @OneToMany(() => Prompt, (prompt) => prompt.topic)
  prompts?: Prompt[];
}


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
import { SkillType } from "./Prompt";

/**
 * Score Entity
 * Stores AI-generated IELTS scores following official IELTS band descriptors
 * 
 * Speaking sub-scores:
 * - Fluency & Coherence (FC)
 * - Lexical Resource (LR)
 * - Grammatical Range & Accuracy (GRA)
 * - Pronunciation (P)
 * 
 * Writing sub-scores:
 * - Task Achievement/Response (TA)
 * - Coherence & Cohesion (CC)
 * - Lexical Resource (LR)
 * - Grammatical Range & Accuracy (GRA)
 */
@Entity("scores")
export class Score {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", unique: true, name: "attemptId" })
  attemptId!: string;

  @Column({
    type: "enum",
    enum: SkillType,
  })
  skillType!: SkillType;

  // ============ Overall Band Score ============
  // Range: 0-9 with 0.5 step (BR36: Score validation)
  @Column({ type: "numeric", precision: 3, scale: 1 })
  overallBand!: number;

  // ============ Speaking Sub-Scores ============
  // Fluency & Coherence (FC)
  @Column({ type: "numeric", precision: 3, scale: 1, nullable: true })
  fluencyCoherence?: number;

  // Pronunciation (P)
  @Column({ type: "numeric", precision: 3, scale: 1, nullable: true })
  pronunciation?: number;

  // ============ Writing Sub-Scores ============
  // Task Achievement / Task Response (TA/TR)
  @Column({ type: "numeric", precision: 3, scale: 1, nullable: true })
  taskAchievement?: number;

  // Coherence & Cohesion (CC)
  @Column({ type: "numeric", precision: 3, scale: 1, nullable: true })
  coherenceCohesion?: number;

  // ============ Shared Sub-Scores (Both Speaking & Writing) ============
  // Lexical Resource (LR)
  @Column({ type: "numeric", precision: 3, scale: 1 })
  lexicalResource!: number;

  // Grammatical Range & Accuracy (GRA)
  @Column({ type: "numeric", precision: 3, scale: 1 })
  grammaticalRange!: number;

  // ============ AI Confidence Score ============
  @Column({ type: "numeric", precision: 4, scale: 3, nullable: true })
  confidence?: number;

  // ============ Feedback (BR53, BR35) ============
  // Main feedback text
  @Column({ type: "text" })
  feedback!: string;

  /**
   * Detailed feedback structure (BR53):
   * {
   *   strengths: string[],
   *   areasForImprovement: string[],
   *   suggestions: string[]
   * }
   */
  @Column({ type: "jsonb", nullable: true })
  detailedFeedback?: {
    strengths: string[];
    areasForImprovement: string[];
    suggestions: string[];
  };

  // Raw AI response for debugging/analysis
  @Column({ type: "jsonb", nullable: true })
  rawAIResponse?: Record<string, any>;

  // ============ Timestamps (BR35: display timestamp) ============
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  // Relations
  @OneToOne(() => Attempt, (attempt) => attempt.score, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "attemptId", referencedColumnName: "id" })
  attempt!: Attempt;

  // ============ Helper Methods ============

  /**
   * Get sub-scores as array for radar chart (BR61)
   */
  getSubScoresForChart(): { label: string; value: number }[] {
    if (this.skillType === SkillType.SPEAKING) {
      return [
        { label: "Fluency & Coherence", value: Number(this.fluencyCoherence) || 0 },
        { label: "Lexical Resource", value: Number(this.lexicalResource) || 0 },
        { label: "Grammatical Range", value: Number(this.grammaticalRange) || 0 },
        { label: "Pronunciation", value: Number(this.pronunciation) || 0 },
      ];
    } else {
      return [
        { label: "Task Achievement", value: Number(this.taskAchievement) || 0 },
        { label: "Coherence & Cohesion", value: Number(this.coherenceCohesion) || 0 },
        { label: "Lexical Resource", value: Number(this.lexicalResource) || 0 },
        { label: "Grammatical Range", value: Number(this.grammaticalRange) || 0 },
      ];
    }
  }

  /**
   * Calculate average of sub-scores
   */
  calculateAverageSubScore(): number {
    const scores = this.getSubScoresForChart().map(s => s.value);
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round((sum / scores.length) * 2) / 2; // Round to 0.5
  }
}

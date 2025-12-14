import { SkillType } from "../entities/Prompt";

/**
 * Score DTOs following IELTS Band Descriptors
 * 
 * Speaking: Fluency & Coherence, Lexical Resource, Grammatical Range, Pronunciation
 * Writing: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range
 */

/**
 * Create Score DTO
 */
export class CreateScoreDTO {
  attemptId!: string;
  skillType!: SkillType;
  
  /**
   * Overall band score (0-9, step 0.5) - BR36
   * @min 0
   * @max 9
   */
  overallBand!: number;
  
  /**
   * AI confidence score (0-1)
   */
  confidence?: number;
  
  // Speaking sub-scores
  fluencyCoherence?: number;
  pronunciation?: number;
  
  // Writing sub-scores
  taskAchievement?: number;
  coherenceCohesion?: number;
  
  // Shared sub-scores
  lexicalResource!: number;
  grammaticalRange!: number;
  
  feedback!: string;
  
  /**
   * Detailed feedback (BR53)
   */
  detailedFeedback?: {
    strengths: string[];
    areasForImprovement: string[];
    suggestions: string[];
  };
}

/**
 * Update Score DTO
 */
export class UpdateScoreDTO {
  overallBand?: number;
  fluencyCoherence?: number;
  pronunciation?: number;
  taskAchievement?: number;
  coherenceCohesion?: number;
  lexicalResource?: number;
  grammaticalRange?: number;
  feedback?: string;
  detailedFeedback?: {
    strengths: string[];
    areasForImprovement: string[];
    suggestions: string[];
  };
}

/**
 * Score Response DTO (BR35: AI score, feedback text, timestamp)
 */
export class ScoreResponseDTO {
  id!: string;
  attemptId!: string;
  skillType!: SkillType;
  overallBand!: number;
  confidence?: number;
  
  // Sub-scores (depends on skillType)
  subScores!: {
    label: string;
    value: number;
  }[];
  
  feedback!: string;
  
  /**
   * Detailed feedback (BR53: Strengths, Areas for Improvement, Suggestions)
   */
  detailedFeedback?: {
    strengths: string[];
    areasForImprovement: string[];
    suggestions: string[];
  };
  
  // Timestamp (BR35)
  createdAt!: Date;
}

/**
 * Speaking Score Response DTO
 */
export class SpeakingScoreResponseDTO {
  id!: string;
  attemptId!: string;
  skillType!: "speaking";
  overallBand!: number;
  confidence?: number;
  
  // IELTS Speaking Band Descriptors
  fluencyCoherence!: number;
  lexicalResource!: number;
  grammaticalRange!: number;
  pronunciation!: number;
  
  feedback!: string;
  detailedFeedback?: {
    strengths: string[];
    areasForImprovement: string[];
    suggestions: string[];
  };
  createdAt!: Date;
}

/**
 * Writing Score Response DTO
 */
export class WritingScoreResponseDTO {
  id!: string;
  attemptId!: string;
  skillType!: "writing";
  overallBand!: number;
  confidence?: number;
  
  // IELTS Writing Band Descriptors
  taskAchievement!: number;
  coherenceCohesion!: number;
  lexicalResource!: number;
  grammaticalRange!: number;
  
  feedback!: string;
  detailedFeedback?: {
    strengths: string[];
    areasForImprovement: string[];
    suggestions: string[];
  };
  createdAt!: Date;
}

/**
 * Score List DTO
 */
export class ScoreListDTO {
  id!: string;
  attemptId!: string;
  skillType!: SkillType;
  overallBand!: number;
  createdAt!: Date;
}

/**
 * Score Detail DTO with attempt info
 */
export class ScoreDetailDTO extends ScoreResponseDTO {
  attemptDate?: Date;
  promptContent?: string;
  promptDifficulty?: string;
  
  // For radar chart (BR61)
  chartData?: {
    label: string;
    value: number;
  }[];
}

/**
 * Score Comparison DTO (BR61, BR62)
 */
export class ScoreComparisonDTO {
  attemptId!: string;
  attemptDate!: Date;
  overallBand!: number;
  subScores!: {
    label: string;
    value: number;
  }[];
  
  // Score change indicator (BR62)
  changeFromPrevious?: {
    bandChange: number;
    percentageChange: number;
    direction: "up" | "down" | "same";
  };
}

/**
 * Pagination parameters
 */
export class ScorePaginationDTO {
  limit?: number;
  offset?: number;
}

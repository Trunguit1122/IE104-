import { UserRole, UserStatus } from "../entities/User";
import { SkillType, DifficultyLevel } from "../entities/Prompt";
import { AttemptStatus } from "../entities/Attempt";

/**
 * Teacher DTOs following SRS Business Rules (BR30-BR45)
 */

// ============ Learner List (UC11, UC12) ============

/**
 * Learner List Filter DTO
 * BR30: 50 students per page
 * BR31: Search by name and email
 * BR32: Filter with AND logic
 */
export class LearnerListFilterDTO {
  search?: string;
  classId?: string;
  status?: UserStatus;
  limit?: number;
  offset?: number;
}

/**
 * Learner List Item DTO
 */
export class LearnerListItemDTO {
  id!: string;
  email!: string;
  displayName?: string;
  avatarUrl?: string;
  status!: UserStatus;
  classNames?: string[];
  // Progress info
  totalAttempts!: number;
  avgScore?: number;
  lastActiveAt?: Date;
  createdAt!: Date;
}

/**
 * Learner List Response DTO
 */
export class LearnerListResponseDTO {
  items!: LearnerListItemDTO[];
  total!: number;
  limit!: number;
  offset!: number;
  hasMore!: boolean;
}

// ============ Learner Profile (UC13) ============

/**
 * Learner Profile DTO
 * BR33: Access permission check
 */
export class LearnerProfileDTO {
  id!: string;
  email!: string;
  displayName?: string;
  avatarUrl?: string;
  status!: UserStatus;
  createdAt!: Date;
  lastLoginAt?: Date;
  // Profile info
  firstName?: string;
  lastName?: string;
  nativeLanguage?: string;
  targetBand?: number;
  currentBand?: number;
  learningGoals?: string;
  // Class info
  enrolledClasses?: Array<{
    id: string;
    name: string;
    teacherName: string;
  }>;
  // Statistics
  totalAttempts!: number;
  speakingAttempts!: number;
  writingAttempts!: number;
  avgOverallScore?: number;
  avgSpeakingScore?: number;
  avgWritingScore?: number;
}

// ============ Learner Practice History (UC14) ============

/**
 * Practice History Filter for Teacher
 * BR34: Sort by date (most recent first)
 */
export class TeacherPracticeHistoryFilterDTO {
  learnerId!: string;
  skillType?: SkillType;
  dateFrom?: string;
  dateTo?: string;
  status?: AttemptStatus;
  limit?: number;
  offset?: number;
}

/**
 * Practice History Item DTO
 */
export class TeacherPracticeHistoryItemDTO {
  attemptId!: string;
  promptContent!: string;
  skillType!: SkillType;
  difficulty!: DifficultyLevel;
  status!: AttemptStatus;
  overallScore?: number;
  teacherScore?: number;
  hasTeacherComment!: boolean;
  createdAt!: Date;
  submittedAt?: Date;
  scoredAt?: Date;
}

// ============ Attempt Details (UC15) ============

/**
 * Attempt Detail DTO
 * BR35: AI feedback display
 */
export class AttemptDetailDTO {
  attemptId!: string;
  learnerId!: string;
  learnerName?: string;
  promptId!: string;
  promptContent!: string;
  skillType!: SkillType;
  difficulty!: DifficultyLevel;
  status!: AttemptStatus;
  // Content
  writingContent?: string;
  wordCount?: number;
  recordings?: Array<{
    id: string;
    fileName: string;
    storageUrl: string;
    duration?: number;
  }>;
  // AI Score (BR35: AI score, feedback text, timestamp)
  aiScore?: {
    skillType: SkillType;
    overallBand: number;
    confidence?: number;
    // Sub-scores for radar chart (BR61)
    subScores: {
      label: string;
      value: number;
    }[];
    feedback: string;
    // BR53: Strengths, Areas for Improvement, Suggestions
    detailedFeedback?: {
      strengths: string[];
      areasForImprovement: string[];
      suggestions: string[];
    };
    scoredAt: Date;
  };
  // Teacher evaluation
  teacherScore?: number;
  teacherComment?: string;
  evaluatedBy?: string;
  evaluatedAt?: Date;
  // Timestamps
  createdAt!: Date;
  startedAt?: Date;
  submittedAt?: Date;
}

// ============ Teacher Evaluation (UC16) ============

/**
 * Add Teacher Evaluation DTO
 * BR36: Score 0.0-9.0, step 0.5
 * BR37: Comment max 2000 chars
 * BR38: Update status, notify student
 */
export class AddTeacherEvaluationDTO {
  attemptId!: string;
  /**
   * Score between 0.0 and 9.0, step 0.5
   */
  score?: number;
  /**
   * Comment max 2000 characters
   */
  comment?: string;
}

/**
 * Evaluation Response DTO
 */
export class TeacherEvaluationResponseDTO {
  success!: boolean;
  message?: string;
  attemptId?: string;
  teacherScore?: number;
  teacherComment?: string;
  evaluatedAt?: Date;
  status?: AttemptStatus;
}

// ============ Suggest Practice Topics (UC17) ============

/**
 * Suggest Topics DTO
 * BR39: Level matching based on band score
 */
export class SuggestTopicsDTO {
  learnerId!: string;
  skillType?: SkillType;
}

/**
 * Topic Suggestion DTO
 */
export class TopicSuggestionDTO {
  topicId!: string;
  topicName!: string;
  skillType!: SkillType;
  difficulty!: DifficultyLevel;
  promptCount!: number;
  reason?: string;
}

/**
 * Topic Suggestions Response DTO
 */
export class TopicSuggestionsResponseDTO {
  success!: boolean;
  learnerCurrentBand?: number;
  suggestedDifficulty!: DifficultyLevel;
  suggestions!: TopicSuggestionDTO[];
}

// ============ Learner Progress (UC18) ============

/**
 * Progress Filter DTO
 * BR40: Weekly/Monthly toggle
 * BR41: Average Score Trend, Total Attempts
 */
export class ProgressFilterDTO {
  learnerId!: string;
  period: "weekly" | "monthly" = "weekly";
  skillType?: SkillType;
}

/**
 * Progress Data Point DTO
 */
export class ProgressDataPointDTO {
  date!: string;
  avgScore!: number;
  attemptCount!: number;
}

/**
 * Progress Response DTO
 */
export class ProgressResponseDTO {
  success!: boolean;
  learnerId!: string;
  learnerName?: string;
  period!: "weekly" | "monthly";
  skillType?: SkillType;
  // BR41: Metrics
  totalAttempts!: number;
  avgScoreTrend!: ProgressDataPointDTO[];
  // Additional metrics
  improvement?: number;
  currentAvgScore?: number;
  previousAvgScore?: number;
  strongestArea?: string;
  weakestArea?: string;
}

// ============ Export Reports (UC19) ============

/**
 * Export Report DTO
 * BR42: PDF or XLSX format
 * BR43: Naming convention
 * BR44: Timeout handling
 * BR45: Empty data handling
 */
export class ExportReportDTO {
  learnerId!: string;
  format: "pdf" | "xlsx" = "pdf";
  dateFrom?: string;
  dateTo?: string;
  skillType?: SkillType;
}

/**
 * Export Response DTO
 */
export class ExportResponseDTO {
  success!: boolean;
  message?: string;
  downloadUrl?: string;
  fileName?: string;
  expiresAt?: Date;
}

// ============ Class Management ============

/**
 * Create Class DTO
 */
export class CreateClassDTO {
  name!: string;
  description?: string;
}

/**
 * Update Class DTO
 */
export class UpdateClassDTO {
  name?: string;
  description?: string;
}

/**
 * Add Learners to Class DTO
 */
export class AddLearnersToClassDTO {
  learnerIds!: string[];
}

/**
 * Class Response DTO
 */
export class ClassResponseDTO {
  id!: string;
  name!: string;
  description?: string;
  code?: string;
  teacherId!: string;
  teacherName?: string;
  learnerCount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * Class Detail DTO
 */
export class ClassDetailDTO extends ClassResponseDTO {
  learners?: LearnerListItemDTO[];
}


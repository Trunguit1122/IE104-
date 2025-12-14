import { SkillType, DifficultyLevel } from "../entities/Prompt";
import { AttemptStatus } from "../entities/Attempt";

/**
 * Practice DTOs following SRS Business Rules
 */

// ============ Start Practice Session ============

/**
 * Start Speaking Practice Request DTO
 * BR20: System generates unique SessionID and logs start time
 * BR21: Preparation timer starts
 */
export class StartSpeakingPracticeDTO {
  promptId!: string;
}

/**
 * Start Writing Practice Request DTO
 * BR46: System generates unique AttemptID and logs start timestamp
 * BR48: Check for concurrent session
 */
export class StartWritingPracticeDTO {
  promptId!: string;
}

/**
 * Practice Session Response DTO
 */
export class PracticeSessionResponseDTO {
  success!: boolean;
  message?: string;
  attemptId?: string;
  promptId?: string;
  promptContent?: string;
  skillType?: SkillType;
  prepTime?: number;
  responseTime?: number;
  startedAt?: Date;
  // Writing specific
  minWordCount?: number;
  maxWordCount?: number;
  writingTaskType?: string;
}

// ============ Recording Management (UC8, UC9) ============

/**
 * Upload Recording Request DTO
 * BR22: Microphone permission check (client-side)
 * BR23: Duration limits (30-120 seconds)
 * BR24: File format (.wav, .mp3)
 */
export class UploadRecordingDTO {
  attemptId!: string;
  fileName!: string;
  duration!: number; // in seconds
  fileSize!: number; // in bytes
  mimeType!: string;
}

/**
 * Recording Response DTO
 */
export class RecordingResponseDTO {
  id!: string;
  attemptId!: string;
  fileName!: string;
  storageUrl!: string;
  duration?: number;
  fileSize?: number;
  mimeType?: string;
  uploadedAt!: Date;
}

/**
 * Rename Recording Request DTO
 * BR25: Filename validation (alphanumeric, hyphens, underscores, max 50 chars)
 */
export class RenameRecordingDTO {
  newFileName!: string;
}

// ============ Writing Content (UC21) ============

/**
 * Save Writing Content Request DTO
 * BR49: Autosave every 30 seconds
 * BR50: Real-time word count
 */
export class SaveWritingContentDTO {
  content!: string;
  isAutoSave?: boolean;
}

/**
 * Writing Content Response DTO
 */
export class WritingContentResponseDTO {
  success!: boolean;
  message?: string;
  attemptId!: string;
  content?: string;
  wordCount!: number;
  lastSavedAt?: Date;
  meetsMinimumWords!: boolean;
}

// ============ Submit Attempt (UC10, UC22) ============

/**
 * Submit Speaking Attempt Request DTO
 * BR27: Must select exactly 1 recording
 * BR28: API timeout 30 seconds
 * BR29: Status update to Processing
 */
export class SubmitSpeakingAttemptDTO {
  attemptId!: string;
  selectedRecordingId!: string;
}

/**
 * Submit Writing Attempt Request DTO
 * BR51: Minimum words check (250 for Task 2)
 * BR52: API timeout 60 seconds
 */
export class SubmitWritingAttemptDTO {
  attemptId!: string;
}

/**
 * Submit Response DTO
 */
export class SubmitAttemptResponseDTO {
  success!: boolean;
  message?: string;
  attemptId!: string;
  status!: AttemptStatus;
  scoringJobId?: string;
  estimatedWaitTime?: number; // in seconds
}

// ============ Practice History (UC24) ============

/**
 * Practice History Filter DTO
 * BR55: Default descending order by date
 * BR56: Filter by Skill, Date Range, Score Range
 * BR57: 10 items per page
 */
export class PracticeHistoryFilterDTO {
  skillType?: SkillType;
  dateFrom?: string;
  dateTo?: string;
  scoreMin?: number;
  scoreMax?: number;
  status?: AttemptStatus;
  limit?: number;
  offset?: number;
}

/**
 * Practice History Item DTO
 */
export class PracticeHistoryItemDTO {
  attemptId!: string;
  promptId!: string;
  promptContent!: string;
  skillType!: SkillType;
  difficulty!: DifficultyLevel;
  status!: AttemptStatus;
  overallScore?: number;
  createdAt!: Date;
  submittedAt?: Date;
  scoredAt?: Date;
}

/**
 * Practice History Response DTO
 */
export class PracticeHistoryResponseDTO {
  items!: PracticeHistoryItemDTO[];
  total!: number;
  limit!: number;
  offset!: number;
  hasMore!: boolean;
}

// ============ Compare Attempts (UC25) ============

/**
 * Compare Attempts Request DTO
 * BR58: Minimum 2 attempts
 * BR59: Maximum 5 attempts
 * BR60: Same skill type only
 */
export class CompareAttemptsDTO {
  attemptIds!: string[];
}

/**
 * Attempt Comparison Item DTO
 */
export class AttemptComparisonItemDTO {
  attemptId!: string;
  createdAt!: Date;
  overallScore!: number;
  fluency?: number;
  pronunciation?: number;
  lexical?: number;
  grammar?: number;
  // Writing specific
  taskAchievement?: number;
  coherenceCohesion?: number;
  lexicalResource?: number;
  grammaticalRangeAccuracy?: number;
}

/**
 * Compare Attempts Response DTO
 * BR61: Radar chart data
 * BR62: Difference indicators
 */
export class CompareAttemptsResponseDTO {
  success!: boolean;
  message?: string;
  skillType?: SkillType;
  attempts?: AttemptComparisonItemDTO[];
  scoreChanges?: Array<{
    from: string;
    to: string;
    change: number;
    percentage: number;
    direction: "up" | "down" | "same";
  }>;
}

// ============ Retake Practice (UC26) ============

/**
 * Retake Practice Request DTO
 * BR63: Prompt must still be available
 */
export class RetakePracticeDTO {
  originalAttemptId!: string;
}

/**
 * Retake Practice Response DTO
 */
export class RetakePracticeResponseDTO {
  success!: boolean;
  message?: string;
  newAttemptId?: string;
  promptId?: string;
}

// ============ Prompt List (UC6) ============

/**
 * Prompt List Filter DTO
 * BR17: Filter by Topic, Difficulty
 * BR18: Search minimum 3 characters
 * BR19: Default sorting "Newest First"
 */
export class PromptListFilterDTO {
  skillType?: SkillType;
  topicId?: string;
  difficulty?: DifficultyLevel;
  search?: string;
  sortBy?: "newest" | "oldest" | "difficulty" | "popular";
  limit?: number;
  offset?: number;
}

/**
 * Prompt List Item DTO
 */
export class PromptListItemDTO {
  id!: string;
  content!: string;
  skillType!: SkillType;
  difficulty!: DifficultyLevel;
  topicName?: string;
  prepTime!: number;
  responseTime!: number;
  attemptCount!: number;
  createdAt!: Date;
  // For writing prompts
  writingTaskType?: string;
  minWordCount?: number;
}

/**
 * Prompt List Response DTO
 */
export class PromptListResponseDTO {
  items!: PromptListItemDTO[];
  total!: number;
  limit!: number;
  offset!: number;
  hasMore!: boolean;
}


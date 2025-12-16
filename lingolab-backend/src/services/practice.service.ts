import { AppDataSource } from "../data-source";
import { Attempt, AttemptStatus } from "../entities/Attempt";
import { Prompt, SkillType } from "../entities/Prompt";
import { AttemptMedia, MediaType } from "../entities/AttemptMedia";
import { ScoringJob, ScoringJobStatus } from "../entities/ScoringJob";
import { Score } from "../entities/Score";
import { User } from "../entities/User";
import { Messages, getMessage } from "../constants/messages";
import {
  isValidFilename,
  isValidAudioDuration,
  isValidAudioFile,
  countWords,
  isValidSearchQuery,
  isValidCompareSelection,
} from "../utils/validation.utils";
import {
  StartSpeakingPracticeDTO,
  StartWritingPracticeDTO,
  PracticeSessionResponseDTO,
  UploadRecordingDTO,
  RecordingResponseDTO,
  RenameRecordingDTO,
  SaveWritingContentDTO,
  WritingContentResponseDTO,
  SubmitSpeakingAttemptDTO,
  SubmitWritingAttemptDTO,
  SubmitAttemptResponseDTO,
  PracticeHistoryFilterDTO,
  PracticeHistoryResponseDTO,
  PracticeHistoryItemDTO,
  CompareAttemptsDTO,
  CompareAttemptsResponseDTO,
  RetakePracticeDTO,
  RetakePracticeResponseDTO,
  PromptListFilterDTO,
  PromptListResponseDTO,
  PromptListItemDTO,
} from "../dtos/practice.dto";
import { Between, In, LessThanOrEqual, MoreThanOrEqual, Like, FindOptionsWhere } from "typeorm";

export class PracticeService {
  private attemptRepository = AppDataSource.getRepository(Attempt);
  private promptRepository = AppDataSource.getRepository(Prompt);
  private mediaRepository = AppDataSource.getRepository(AttemptMedia);
  private scoringJobRepository = AppDataSource.getRepository(ScoringJob);
  private scoreRepository = AppDataSource.getRepository(Score);
  private userRepository = AppDataSource.getRepository(User);

  /**
   * UC7: Start Speaking Practice
   * BR20: Generate unique SessionID, log start time
   * BR21: Preparation timer starts
   */
  async startSpeakingPractice(
    learnerId: string,
    dto: StartSpeakingPracticeDTO
  ): Promise<PracticeSessionResponseDTO> {
    // Check if prompt exists
    const prompt = await this.promptRepository.findOne({
      where: { id: dto.promptId },
    });

    // Allow if prompt exists and isActive is not explicitly false
    if (!prompt || prompt.isActive === false) {
      return {
        success: false,
        message: Messages.MSG_031,
      };
    }

    if (prompt.skillType !== SkillType.SPEAKING) {
      return {
        success: false,
        message: "This prompt is not for speaking practice",
      };
    }

    // Create new attempt (BR20)
    const attempt = this.attemptRepository.create({
      learnerId,
      promptId: dto.promptId,
      skillType: SkillType.SPEAKING,
      status: AttemptStatus.IN_PROGRESS,
      startedAt: new Date(),
    });

    const savedAttempt = await this.attemptRepository.save(attempt);

    return {
      success: true,
      attemptId: savedAttempt.id,
      promptId: prompt.id,
      promptContent: prompt.content,
      skillType: SkillType.SPEAKING,
      prepTime: prompt.prepTime, // BR21: 60 seconds default
      responseTime: prompt.responseTime,
      startedAt: savedAttempt.startedAt,
    };
  }

  /**
   * UC20: Start Writing Practice
   * BR46: Generate unique AttemptID, log start timestamp
   * BR47: Display task description, word count requirement
   * BR48: Check concurrent session
   */
  async startWritingPractice(
    learnerId: string,
    dto: StartWritingPracticeDTO
  ): Promise<PracticeSessionResponseDTO> {
    // BR48: Check for active writing session
    const activeSession = await this.attemptRepository.findOne({
      where: {
        learnerId,
        skillType: SkillType.WRITING,
        status: AttemptStatus.IN_PROGRESS,
      },
    });

    if (activeSession) {
      return {
        success: false,
        message: Messages.MSG_023,
      };
    }

    // Check if prompt exists
    const prompt = await this.promptRepository.findOne({
      where: { id: dto.promptId },
    });

    // Allow if prompt exists and isActive is not explicitly false
    if (!prompt || prompt.isActive === false) {
      return {
        success: false,
        message: Messages.MSG_031,
      };
    }

    if (prompt.skillType !== SkillType.WRITING) {
      return {
        success: false,
        message: "This prompt is not for writing practice",
      };
    }

    // Create new attempt (BR46)
    const attempt = this.attemptRepository.create({
      learnerId,
      promptId: dto.promptId,
      skillType: SkillType.WRITING,
      status: AttemptStatus.IN_PROGRESS,
      startedAt: new Date(),
      wordCount: 0,
    });

    const savedAttempt = await this.attemptRepository.save(attempt);

    return {
      success: true,
      attemptId: savedAttempt.id,
      promptId: prompt.id,
      promptContent: prompt.content,
      skillType: SkillType.WRITING,
      startedAt: savedAttempt.startedAt,
      // BR47: Word count requirement
      minWordCount: prompt.minWordCount || 250,
      maxWordCount: prompt.maxWordCount,
      writingTaskType: prompt.writingTaskType,
    };
  }

  /**
   * UC8: Upload Recording
   * BR22: Permission check (client-side)
   * BR23: Duration limits (30-120 seconds)
   * BR24: File format (.wav, .mp3)
   */
  async uploadRecording(
    learnerId: string,
    dto: UploadRecordingDTO,
    storageUrl: string
  ): Promise<RecordingResponseDTO | { success: false; message: string }> {
    // Verify attempt belongs to learner
    const attempt = await this.attemptRepository.findOne({
      where: { id: dto.attemptId, learnerId },
    });

    if (!attempt) {
      return {
        success: false,
        message: Messages.MSG_404,
      };
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      return {
        success: false,
        message: "Cannot upload to a completed attempt",
      };
    }

    // BR23: Validate duration
    if (!isValidAudioDuration(dto.duration)) {
      return {
        success: false,
        message: Messages.MSG_013,
      };
    }

    // BR24: Validate file format
    if (!isValidAudioFile(dto.mimeType)) {
      return {
        success: false,
        message: "Invalid audio format. Only .wav and .mp3 are allowed.",
      };
    }

    // Create media record
    const media = this.mediaRepository.create({
      attemptId: dto.attemptId,
      mediaType: MediaType.AUDIO,
      storageUrl,
      fileName: dto.fileName,
      duration: dto.duration,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
    });

    const savedMedia = await this.mediaRepository.save(media);

    return {
      id: savedMedia.id,
      attemptId: savedMedia.attemptId,
      fileName: savedMedia.fileName,
      storageUrl: savedMedia.storageUrl,
      duration: savedMedia.duration,
      fileSize: savedMedia.fileSize,
      mimeType: savedMedia.mimeType,
      uploadedAt: savedMedia.uploadedAt,
    };
  }

  /**
   * UC9: Rename Recording
   * BR25: Filename validation
   */
  async renameRecording(
    learnerId: string,
    mediaId: string,
    dto: RenameRecordingDTO
  ): Promise<RecordingResponseDTO | { success: false; message: string }> {
    // BR25: Validate filename
    if (!isValidFilename(dto.newFileName)) {
      return {
        success: false,
        message: Messages.MSG_014,
      };
    }

    const media = await this.mediaRepository.findOne({
      where: { id: mediaId },
      relations: ["attempt"],
    });

    if (!media || media.attempt.learnerId !== learnerId) {
      return {
        success: false,
        message: Messages.MSG_404,
      };
    }

    await this.mediaRepository.update(mediaId, { fileName: dto.newFileName });

    const updated = await this.mediaRepository.findOne({ where: { id: mediaId } });

    return {
      id: updated!.id,
      attemptId: updated!.attemptId,
      fileName: updated!.fileName,
      storageUrl: updated!.storageUrl,
      duration: updated!.duration,
      fileSize: updated!.fileSize,
      mimeType: updated!.mimeType,
      uploadedAt: updated!.uploadedAt,
    };
  }

  /**
   * UC9: Delete Recording
   * BR26: Immediate removal from session
   */
  async deleteRecording(
    learnerId: string,
    mediaId: string
  ): Promise<{ success: boolean; message: string }> {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId },
      relations: ["attempt"],
    });

    if (!media || media.attempt.learnerId !== learnerId) {
      return {
        success: false,
        message: Messages.MSG_404,
      };
    }

    if (media.attempt.status !== AttemptStatus.IN_PROGRESS) {
      return {
        success: false,
        message: "Cannot delete from a completed attempt",
      };
    }

    await this.mediaRepository.delete(mediaId);

    return {
      success: true,
      message: "Recording deleted successfully",
    };
  }

  /**
   * UC21: Save Writing Content
   * BR49: Autosave every 30 seconds
   * BR50: Real-time word count
   */
  async saveWritingContent(
    learnerId: string,
    attemptId: string,
    dto: SaveWritingContentDTO
  ): Promise<WritingContentResponseDTO> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId, learnerId },
      relations: ["prompt"],
    });

    if (!attempt) {
      return {
        success: false,
        message: Messages.MSG_404,
        attemptId,
        wordCount: 0,
        meetsMinimumWords: false,
      };
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      return {
        success: false,
        message: "Cannot update a completed attempt",
        attemptId,
        wordCount: 0,
        meetsMinimumWords: false,
      };
    }

    // BR50: Calculate word count
    const wordCount = countWords(dto.content);
    const minWords = attempt.prompt?.minWordCount || 250;
    const meetsMinimumWords = wordCount >= minWords;

    // Update attempt
    await this.attemptRepository.update(attemptId, {
      writingContent: dto.content,
      wordCount,
      lastAutoSavedAt: dto.isAutoSave ? new Date() : undefined,
    });

    return {
      success: true,
      message: dto.isAutoSave ? Messages.MSG_024 : "Content saved",
      attemptId,
      content: dto.content,
      wordCount,
      lastSavedAt: new Date(),
      meetsMinimumWords,
    };
  }

  /**
   * UC10: Submit Speaking Attempt
   * BR27: Must select exactly 1 recording
   * BR28: API timeout 30 seconds
   * BR29: Status update to Processing
   */
  async submitSpeakingAttempt(
    learnerId: string,
    dto: SubmitSpeakingAttemptDTO
  ): Promise<SubmitAttemptResponseDTO> {
    try {
      const attempt = await this.attemptRepository.findOne({
        where: { id: dto.attemptId, learnerId },
        relations: ["media"],
      });

      if (!attempt) {
        return {
          success: false,
          message: Messages.MSG_404,
          attemptId: dto.attemptId,
          status: AttemptStatus.IN_PROGRESS,
        };
      }

      if (attempt.status !== AttemptStatus.IN_PROGRESS) {
        return {
          success: false,
          message: "Attempt already submitted",
          attemptId: dto.attemptId,
          status: attempt.status,
        };
      }

      // BR27: Check if recording is selected
      const selectedRecording = attempt.media?.find((m) => m.id === dto.selectedRecordingId);
      
      if (!selectedRecording) {
        return {
          success: false,
          message: Messages.MSG_015,
          attemptId: dto.attemptId,
          status: AttemptStatus.IN_PROGRESS,
        };
      }

      // BR29: Update status to Processing
      await this.attemptRepository.update(dto.attemptId, {
        status: AttemptStatus.PROCESSING,
        submittedAt: new Date(),
      });

      // Check if scoring job already exists for this attempt
      let existingJob = await this.scoringJobRepository.findOne({
        where: { attempt: { id: dto.attemptId } },
      });

      let savedJob;
      if (existingJob) {
        console.log('⚠️  [PracticeService] Scoring job already exists for attempt:', dto.attemptId);
        // If job exists and is in failed state, reset it
        if (existingJob.status === ScoringJobStatus.FAILED) {
          await this.scoringJobRepository.update(existingJob.id, {
            status: ScoringJobStatus.QUEUED,
            errorMessage: undefined,
          });
          console.log('🔄 [PracticeService] Reset failed scoring job to QUEUED');
        }
        savedJob = existingJob;
      } else {
        // Create new scoring job - use relation object for proper FK mapping
        const scoringJob = this.scoringJobRepository.create({
          attempt: { id: dto.attemptId },
          status: ScoringJobStatus.QUEUED,
        });
        savedJob = await this.scoringJobRepository.save(scoringJob);
      }

      // Trigger scoring immediately in background (don't await)
      console.log('🤖 [PracticeService] Triggering AI scoring in background for jobId:', savedJob.id);
      this.triggerScoringInBackground(savedJob.id).catch(err => {
        console.error('❌ [PracticeService] Failed to trigger scoring:', err);
      });

      return {
        success: true,
        message: "Scoring in progress...",
        attemptId: dto.attemptId,
        status: AttemptStatus.PROCESSING,
        scoringJobId: savedJob.id,
        estimatedWaitTime: 30, // BR28
      };
    } catch (error: any) {
      console.error('❌ [PracticeService] Error in submitSpeakingAttempt:', error);
      
      // Rollback status to IN_PROGRESS if something went wrong
      try {
        await this.attemptRepository.update(dto.attemptId, {
          status: AttemptStatus.IN_PROGRESS,
        });
        console.log('✅ [PracticeService] Rolled back attempt status to IN_PROGRESS');
      } catch (rollbackError) {
        console.error('❌ [PracticeService] Failed to rollback status:', rollbackError);
      }
      
      return {
        success: false,
        message: error.message || Messages.MSG_500,
        attemptId: dto.attemptId,
        status: AttemptStatus.IN_PROGRESS,
      };
    }
  }

  /**
   * Trigger scoring job processing in background
   * This is a fire-and-forget operation
   */
  private async triggerScoringInBackground(jobId: string): Promise<void> {
    // Import ScoringService here to avoid circular dependency
    const { ScoringService } = await import('./scoring.service');
    const scoringService = new ScoringService();
    
    const result = await scoringService.processScoringJob(jobId);
    
    if (!result.success) {
      console.error('❌ [PracticeService] Scoring failed for jobId:', jobId, result.message);
    }
  }

  /**
   * UC22: Submit Writing Attempt
   * BR51: Minimum words check
   * BR52: API timeout 60 seconds
   */
  async submitWritingAttempt(
    learnerId: string,
    dto: SubmitWritingAttemptDTO
  ): Promise<SubmitAttemptResponseDTO> {
    try {
      const attempt = await this.attemptRepository.findOne({
        where: { id: dto.attemptId, learnerId },
        relations: ["prompt"],
      });

      if (!attempt) {
        return {
          success: false,
          message: Messages.MSG_404,
          attemptId: dto.attemptId,
          status: AttemptStatus.IN_PROGRESS,
        };
      }

      if (attempt.status !== AttemptStatus.IN_PROGRESS) {
        return {
          success: false,
          message: "Attempt already submitted",
          attemptId: dto.attemptId,
          status: attempt.status,
        };
      }

      // BR51: Check minimum words (BR47: Task 1 = 150, Task 2 = 250)
      const minWords = attempt.prompt?.minWordCount || 
        (attempt.prompt?.writingTaskType === "task_1" ? 150 : 250);
      if (attempt.wordCount < minWords) {
        return {
          success: false,
          message: getMessage("MSG_025", { count: attempt.wordCount }),
          attemptId: dto.attemptId,
          status: AttemptStatus.IN_PROGRESS,
        };
      }

      // Update status to Processing
      await this.attemptRepository.update(dto.attemptId, {
        status: AttemptStatus.PROCESSING,
        submittedAt: new Date(),
      });

      // Check if scoring job already exists for this attempt
      let existingJob = await this.scoringJobRepository.findOne({
        where: { attempt: { id: dto.attemptId } },
      });

      let savedJob;
      if (existingJob) {
        // If job exists and is in failed state, reset it
        if (existingJob.status === ScoringJobStatus.FAILED) {
          await this.scoringJobRepository.update(existingJob.id, {
            status: ScoringJobStatus.QUEUED,
            errorMessage: undefined,
          });
        }
        savedJob = existingJob;
      } else {
        // Create new scoring job - use relation object for proper FK mapping
        const scoringJob = this.scoringJobRepository.create({
          attempt: { id: dto.attemptId },
          status: ScoringJobStatus.QUEUED,
        });
        savedJob = await this.scoringJobRepository.save(scoringJob);
      }

      // Trigger scoring immediately in background (don't await)
      this.triggerScoringInBackground(savedJob.id).catch(err => {
        console.error('❌ [PracticeService] Failed to trigger scoring:', err);
      });

      return {
        success: true,
        message: "Scoring in progress...",
        attemptId: dto.attemptId,
        status: AttemptStatus.PROCESSING,
        scoringJobId: savedJob.id,
        estimatedWaitTime: 60, // BR52
      };
    } catch (error: any) {
      console.error('❌ [PracticeService] Error in submitWritingAttempt:', error);
      
      // Rollback status to IN_PROGRESS if something went wrong
      try {
        await this.attemptRepository.update(dto.attemptId, {
          status: AttemptStatus.IN_PROGRESS,
        });
      } catch (rollbackError) {
        console.error('❌ [PracticeService] Failed to rollback status:', rollbackError);
      }
      
      return {
        success: false,
        message: error.message || Messages.MSG_500,
        attemptId: dto.attemptId,
        status: AttemptStatus.IN_PROGRESS,
      };
    }
  }

  /**
   * UC24: Get Practice History
   * BR55: Default descending order by date
   * BR56: Filter by Skill, Date Range, Score Range
   * BR57: 10 items per page
   */
  async getPracticeHistory(
    learnerId: string,
    filter: PracticeHistoryFilterDTO
  ): Promise<PracticeHistoryResponseDTO> {
    const limit = filter.limit || 10; // BR57
    const offset = filter.offset || 0;

    const where: FindOptionsWhere<Attempt> = { learnerId };

    if (filter.skillType) {
      where.skillType = filter.skillType;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    // Build query
    const queryBuilder = this.attemptRepository
      .createQueryBuilder("attempt")
      .leftJoinAndSelect("attempt.prompt", "prompt")
      .leftJoinAndSelect("attempt.score", "score")
      .where("attempt.learnerId = :learnerId", { learnerId });

    if (filter.skillType) {
      queryBuilder.andWhere("attempt.skillType = :skillType", { skillType: filter.skillType });
    }

    if (filter.status) {
      queryBuilder.andWhere("attempt.status = :status", { status: filter.status });
    }

    if (filter.dateFrom) {
      queryBuilder.andWhere("attempt.createdAt >= :dateFrom", { dateFrom: filter.dateFrom });
    }

    if (filter.dateTo) {
      queryBuilder.andWhere("attempt.createdAt <= :dateTo", { dateTo: filter.dateTo });
    }

    if (filter.scoreMin !== undefined) {
      queryBuilder.andWhere("score.overallBand >= :scoreMin", { scoreMin: filter.scoreMin });
    }

    if (filter.scoreMax !== undefined) {
      queryBuilder.andWhere("score.overallBand <= :scoreMax", { scoreMax: filter.scoreMax });
    }

    // BR55: Default descending order by date
    queryBuilder.orderBy("attempt.createdAt", "DESC");

    const [attempts, total] = await queryBuilder
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    const items: PracticeHistoryItemDTO[] = attempts.map((attempt) => ({
      attemptId: attempt.id,
      promptId: attempt.promptId,
      promptContent: attempt.prompt?.content || "",
      skillType: attempt.skillType,
      difficulty: attempt.prompt?.difficulty,
      status: attempt.status,
      overallScore: attempt.score?.overallBand,
      createdAt: attempt.createdAt,
      submittedAt: attempt.submittedAt,
      scoredAt: attempt.scoredAt,
    }));

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * UC25: Compare Practice Attempts
   * BR58-BR62: Validation and comparison logic
   */
  async compareAttempts(
    learnerId: string,
    dto: CompareAttemptsDTO
  ): Promise<CompareAttemptsResponseDTO> {
    // BR58-BR59: Validate selection count
    const validation = isValidCompareSelection(dto.attemptIds);
    if (!validation.valid) {
      return {
        success: false,
        message: Messages[validation.error as keyof typeof Messages],
      };
    }

    // Get attempts
    const attempts = await this.attemptRepository.find({
      where: {
        id: In(dto.attemptIds),
        learnerId,
        status: AttemptStatus.SCORED,
      },
      relations: ["score"],
      order: { createdAt: "ASC" },
    });

    if (attempts.length < 2) {
      return {
        success: false,
        message: Messages.MSG_028,
      };
    }

    // BR60: Check same skill type
    const skillTypes = new Set(attempts.map((a) => a.skillType));
    if (skillTypes.size > 1) {
      return {
        success: false,
        message: Messages.MSG_030,
      };
    }

    const skillType = attempts[0].skillType;

    // BR61-BR62: Build comparison data with IELTS sub-scores
    const comparisonItems = attempts.map((attempt) => ({
      attemptId: attempt.id,
      createdAt: attempt.createdAt,
      overallScore: Number(attempt.score?.overallBand) || 0,
      // Get sub-scores for radar chart (BR61)
      subScores: attempt.score?.getSubScoresForChart() || [],
      skillType: attempt.skillType,
    }));

    // BR62: Calculate score changes
    const scoreChanges = [];
    for (let i = 1; i < comparisonItems.length; i++) {
      const prev = comparisonItems[i - 1];
      const curr = comparisonItems[i];
      const change = curr.overallScore - prev.overallScore;
      const percentage = prev.overallScore > 0 
        ? ((change / prev.overallScore) * 100)
        : 0;

      scoreChanges.push({
        from: prev.attemptId,
        to: curr.attemptId,
        change,
        percentage: Math.round(percentage * 10) / 10,
        direction: change > 0 ? "up" : change < 0 ? "down" : "same" as "up" | "down" | "same",
      });
    }

    return {
      success: true,
      skillType,
      attempts: comparisonItems,
      scoreChanges,
    };
  }

  /**
   * UC26: Retake Practice
   * BR63: Prompt must still be available
   */
  async retakePractice(
    learnerId: string,
    dto: RetakePracticeDTO
  ): Promise<RetakePracticeResponseDTO> {
    // Get original attempt
    const originalAttempt = await this.attemptRepository.findOne({
      where: { id: dto.originalAttemptId, learnerId },
      relations: ["prompt"],
    });

    if (!originalAttempt) {
      return {
        success: false,
        message: Messages.MSG_404,
      };
    }

    // BR63: Check if prompt is still available (if isActive is explicitly false, reject)
    // Allow retake if isActive is true or undefined (for backward compatibility)
    if (originalAttempt.prompt && originalAttempt.prompt.isActive === false) {
      return {
        success: false,
        message: Messages.MSG_031,
      };
    }

    // Create new attempt
    if (originalAttempt.skillType === SkillType.SPEAKING) {
      const result = await this.startSpeakingPractice(learnerId, {
        promptId: originalAttempt.promptId,
      });
      return {
        success: result.success,
        message: result.message,
        newAttemptId: result.attemptId,
        promptId: result.promptId,
      };
    } else {
      const result = await this.startWritingPractice(learnerId, {
        promptId: originalAttempt.promptId,
      });
      return {
        success: result.success,
        message: result.message,
        newAttemptId: result.attemptId,
        promptId: result.promptId,
      };
    }
  }

  /**
   * UC6: Get Prompt List
   * BR17: Filter by Topic, Difficulty
   * BR18: Search minimum 3 characters
   * BR19: Default sorting "Newest First"
   */
  async getPromptList(
    filter: PromptListFilterDTO
  ): Promise<PromptListResponseDTO> {
    const limit = filter.limit || 10;
    const offset = filter.offset || 0;

    const queryBuilder = this.promptRepository
      .createQueryBuilder("prompt")
      .leftJoinAndSelect("prompt.topic", "topic")
      .leftJoin("prompt.attempts", "attempts")
      .addSelect("COUNT(attempts.id)", "attemptCount")
      .where("prompt.isActive = :isActive", { isActive: true })
      .groupBy("prompt.id")
      .addGroupBy("topic.id");

    // BR17: Filter by skill type
    if (filter.skillType) {
      queryBuilder.andWhere("prompt.skillType = :skillType", { skillType: filter.skillType });
    }

    // BR17: Filter by topic
    if (filter.topicId) {
      queryBuilder.andWhere("prompt.topicId = :topicId", { topicId: filter.topicId });
    }

    // BR17: Filter by difficulty
    if (filter.difficulty) {
      queryBuilder.andWhere("prompt.difficulty = :difficulty", { difficulty: filter.difficulty });
    }

    // BR18: Search (minimum 3 characters)
    if (filter.search && isValidSearchQuery(filter.search)) {
      queryBuilder.andWhere(
        "(prompt.content ILIKE :search OR prompt.description ILIKE :search)",
        { search: `%${filter.search}%` }
      );
    }

    // BR19: Sorting
    switch (filter.sortBy) {
      case "oldest":
        queryBuilder.orderBy("prompt.createdAt", "ASC");
        break;
      case "difficulty":
        queryBuilder.orderBy("prompt.difficulty", "ASC");
        break;
      case "popular":
        queryBuilder.orderBy("attemptCount", "DESC");
        break;
      default: // "newest"
        queryBuilder.orderBy("prompt.createdAt", "DESC");
    }

    const [prompts, total] = await queryBuilder
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    const items: PromptListItemDTO[] = prompts.map((prompt) => ({
      id: prompt.id,
      content: prompt.content,
      skillType: prompt.skillType,
      difficulty: prompt.difficulty,
      topicName: prompt.topic?.name,
      prepTime: prompt.prepTime,
      responseTime: prompt.responseTime,
      attemptCount: (prompt as any).attemptCount || 0,
      createdAt: prompt.createdAt,
      writingTaskType: prompt.writingTaskType,
      minWordCount: prompt.minWordCount,
    }));

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get active writing session for a learner
   */
  async getActiveWritingSession(learnerId: string): Promise<Attempt | null> {
    return await this.attemptRepository.findOne({
      where: {
        learnerId,
        skillType: SkillType.WRITING,
        status: AttemptStatus.IN_PROGRESS,
      },
      relations: ["prompt"],
    });
  }

  /**
   * Cancel active session
   */
  async cancelSession(
    learnerId: string,
    attemptId: string
  ): Promise<{ success: boolean; message: string }> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId, learnerId, status: AttemptStatus.IN_PROGRESS },
    });

    if (!attempt) {
      return {
        success: false,
        message: Messages.MSG_404,
      };
    }

    await this.attemptRepository.delete(attemptId);

    return {
      success: true,
      message: "Session cancelled",
    };
  }

  /**
   * Get attempt recordings
   */
  async getAttemptRecordings(learnerId: string, attemptId: string): Promise<RecordingResponseDTO[]> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId, learnerId },
    });

    if (!attempt) {
      return [];
    }

    const media = await this.mediaRepository.find({
      where: { attemptId },
      order: { uploadedAt: "DESC" },
    });

    return media.map((m) => ({
      id: m.id,
      attemptId: m.attemptId,
      fileName: m.fileName,
      storageUrl: m.storageUrl,
      duration: m.duration,
      fileSize: m.fileSize,
      mimeType: m.mimeType,
      uploadedAt: m.uploadedAt,
    }));
  }
}


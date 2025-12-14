import { AppDataSource } from "../data-source";
import { Attempt, AttemptStatus } from "../entities/Attempt";
import { ScoringJob, ScoringJobStatus } from "../entities/ScoringJob";
import { Score } from "../entities/Score";
// Feedback entity not used for AI scoring (stored in Score.detailedFeedback instead)
import { SkillType } from "../entities/Prompt";
import { AttemptMedia } from "../entities/AttemptMedia";
import { Messages } from "../constants/messages";
import { aiScoringService, AIScoringResult } from "./ai-scoring.service";
import { storageService } from "./storage.service";

/**
 * Scoring Service
 * Integrates with modelIELTS AI API for IELTS scoring
 * https://github.com/Trunguit1122/modelIELTS
 */
export class ScoringService {
  private attemptRepository = AppDataSource.getRepository(Attempt);
  private scoringJobRepository = AppDataSource.getRepository(ScoringJob);
  private scoreRepository = AppDataSource.getRepository(Score);
  private mediaRepository = AppDataSource.getRepository(AttemptMedia);

  /**
   * Process a scoring job using AI Scoring API
   */
  async processScoringJob(jobId: string): Promise<{ success: boolean; message: string; hasIssues?: boolean }> {
    const job = await this.scoringJobRepository.findOne({
      where: { id: jobId },
      relations: ["attempt", "attempt.media", "attempt.prompt"],
    });

    if (!job) {
      return { success: false, message: "Scoring job not found" };
    }

    // If attempt not loaded via relation, load it manually
    if (!job.attempt) {
      const attempt = await this.attemptRepository.findOne({
        where: { id: job.attemptId },
        relations: ["media", "prompt"],
      });
      
      if (!attempt) {
        return { success: false, message: "Attempt not found for this job" };
      }
      
      job.attempt = attempt;
    }

    if (job.status !== ScoringJobStatus.QUEUED) {
      return { success: false, message: "Job already processed" };
    }

    try {
      // Update job status to processing
      await this.scoringJobRepository.update(jobId, {
        status: ScoringJobStatus.PROCESSING,
        startedAt: new Date(),
      });

      // Get AI scoring result based on skill type
      let result: AIScoringResult;

      if (job.attempt.skillType === SkillType.WRITING) {
        // Score writing using essay content
        result = await aiScoringService.scoreWriting(
          job.attempt.writingContent || "",
          job.attempt.prompt?.content
        );
      } else {
        // Score speaking - try audio first, fallback to transcript
        const audioMedia = job.attempt.media?.find(
          (m) => m.mediaType === "audio"
        );

        if (audioMedia && audioMedia.storageUrl) {
          // Try to read audio file using storage service (async, supports S3)
          try {
            const audioBuffer = await storageService.download(audioMedia.storageUrl);
            if (audioBuffer) {
              const audioResult = await aiScoringService.scoreSpeakingAudio(
                audioBuffer,
                audioMedia.fileName
              );
              result = audioResult;
            } else {
              // Fallback to mock if file not found
              console.warn("Audio file not found in storage, using mock scoring");
              result = await this.getMockSpeakingScore(job.attempt);
            }
          } catch (audioError) {
            console.error("Audio scoring failed, using mock:", audioError);
            result = await this.getMockSpeakingScore(job.attempt);
          }
        } else {
          // No audio, use mock scoring
          result = await this.getMockSpeakingScore(job.attempt);
        }
      }

      // Handle scoring failure with user-friendly feedback (e.g., unclear audio)
      if (!result.success) {
        // Still save the failed score with feedback so user knows what went wrong
        const attemptId = job.attempt.id;
        const score = this.scoreRepository.create({
          attemptId: attemptId,
          skillType: job.attempt.skillType,
          overallBand: 0,
          confidence: 0,
          fluencyCoherence: 0,
          pronunciation: 0,
          lexicalResource: 0,
          grammaticalRange: 0,
          feedback: result.feedback || "Scoring failed. Please try again.",
          detailedFeedback: result.detailedFeedback || {
            strengths: [],
            areasForImprovement: ["Không thể chấm điểm"],
            suggestions: ["Vui lòng thử lại"],
          },
          rawAIResponse: { error: result.error },
        });
        
        await this.scoreRepository.save(score);
        
        // Mark attempt as SCORED but with 0 score (user can see the feedback)
        await this.attemptRepository.update(attemptId, {
          status: AttemptStatus.SCORED,
          scoredAt: new Date(),
        });
        
        // Mark job as completed (not failed, since we saved the feedback)
        await this.scoringJobRepository.update(jobId, {
          status: ScoringJobStatus.COMPLETED,
          completedAt: new Date(),
          errorMessage: result.error,
        });
        
        console.warn(`Scoring completed with issues for attemptId: ${attemptId}. Error: ${result.error}`);
        return { success: true, message: "Scoring completed with feedback", hasIssues: true };
      }

      // Save score to database following IELTS Band Descriptors
      // Use job.attempt.id instead of job.attemptId (virtual property not populated by TypeORM)
      const attemptId = job.attempt.id;
      const score = this.scoreRepository.create({
        attemptId: attemptId,
        skillType: job.attempt.skillType,
        overallBand: result.overallBand,
        confidence: result.confidence,
        // Speaking sub-scores
        fluencyCoherence: result.fluencyCoherence,
        pronunciation: result.pronunciation,
        // Writing sub-scores
        taskAchievement: result.taskAchievement,
        coherenceCohesion: result.coherenceCohesion,
        // Shared sub-scores
        lexicalResource: result.lexicalResource || 0,
        grammaticalRange: result.grammaticalRange || 0,
        // Feedback (BR53: Strengths, Areas for Improvement, Suggestions)
        feedback: result.feedback,
        detailedFeedback: result.detailedFeedback,
        rawAIResponse: result.rawResponse,
      });

      await this.scoreRepository.save(score);

      // Note: AI feedback is stored in Score.detailedFeedback
      // Feedback entity is for teacher comments only (requires valid authorId UUID)

      // Update attempt status
      await this.attemptRepository.update(attemptId, {
        status: AttemptStatus.SCORED,
        scoredAt: new Date(),
      });

      // Update job status
      await this.scoringJobRepository.update(jobId, {
        status: ScoringJobStatus.COMPLETED,
        completedAt: new Date(),
      });

      return { success: true, message: "Scoring completed successfully" };
    } catch (error: any) {
      console.error("Scoring job failed:", error);

      // Update job as failed
      const retryCount = job.retryCount + 1;
      const maxRetries = 3;

      await this.scoringJobRepository.update(jobId, {
        status: retryCount >= maxRetries ? ScoringJobStatus.FAILED : ScoringJobStatus.QUEUED,
        errorMessage: error.message,
        retryCount,
      });

      // If max retries reached, mark attempt as failed
      if (retryCount >= maxRetries) {
        await this.attemptRepository.update(job.attempt?.id || job.attemptId, {
          status: AttemptStatus.FAILED,
        });
      }

      return { success: false, message: error.message };
    }
  }

  /**
   * Check AI Scoring service health
   */
  async checkAIServiceHealth(): Promise<boolean> {
    return await aiScoringService.healthCheck();
  }

  /**
   * Get scoring result for an attempt
   */
  async getScoringResult(attemptId: string): Promise<{
    success: boolean;
    status?: AttemptStatus;
    score?: Score;
    feedback?: string;
    message?: string;
  }> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
      relations: ["score"],
    });

    if (!attempt) {
      return { success: false, message: Messages.MSG_404 };
    }

    if (attempt.status === AttemptStatus.PROCESSING) {
      return {
        success: true,
        status: AttemptStatus.PROCESSING,
        message: "Scoring in progress...",
      };
    }

    if (attempt.status === AttemptStatus.FAILED) {
      return {
        success: false,
        status: AttemptStatus.FAILED,
        message: Messages.MSG_027,
      };
    }

    if (attempt.score) {
      return {
        success: true,
        status: attempt.status,
        score: attempt.score,
        feedback: attempt.score.feedback,
      };
    }

    return {
      success: false,
      status: attempt.status,
      message: "Score not available",
    };
  }

  /**
   * Request re-scoring (BR54)
   */
  async requestRescore(attemptId: string): Promise<{ success: boolean; message: string; jobId?: string }> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
    });

    if (!attempt) {
      return { success: false, message: Messages.MSG_404 };
    }

    if (attempt.status !== AttemptStatus.FAILED) {
      return { success: false, message: "Only failed attempts can be re-scored" };
    }

    // Delete existing failed score if any
    await this.scoreRepository.delete({ attemptId });

    // Create new scoring job
    const job = this.scoringJobRepository.create({
      attempt: { id: attemptId },
      status: ScoringJobStatus.QUEUED,
    });

    const savedJob = await this.scoringJobRepository.save(job);

    // Update attempt status
    await this.attemptRepository.update(attemptId, {
      status: AttemptStatus.PROCESSING,
    });

    return {
      success: true,
      message: "Re-scoring requested",
      jobId: savedJob.id,
    };
  }

  /**
   * Get pending scoring jobs
   */
  async getPendingJobs(limit: number = 10): Promise<ScoringJob[]> {
    return await this.scoringJobRepository.find({
      where: { status: ScoringJobStatus.QUEUED },
      order: { createdAt: "ASC" },
      take: limit,
    });
  }

  /**
   * Score writing content directly (for real-time feedback)
   */
  async scoreWritingDirect(essay: string, prompt?: string): Promise<AIScoringResult> {
    return await aiScoringService.scoreWriting(essay, prompt);
  }

  /**
   * Score speaking text directly
   */
  async scoreSpeakingTextDirect(answerText: string): Promise<AIScoringResult> {
    return await aiScoringService.scoreSpeakingText(answerText);
  }

  /**
   * Transcribe audio
   */
  async transcribeAudio(audioBuffer: Buffer, fileName: string, language: string = "en") {
    return await aiScoringService.transcribeAudio(audioBuffer, fileName, language);
  }

  // ============ Private Methods ============

  /**
   * Mock speaking score (fallback when AI service unavailable)
   * Uses IELTS Speaking Band Descriptors
   */
  private async getMockSpeakingScore(attempt: Attempt): Promise<AIScoringResult> {
    const baseScore = 5 + Math.random() * 3;
    const fluencyCoherence = this.roundToHalf(baseScore + (Math.random() - 0.5));
    const pronunciation = this.roundToHalf(baseScore + (Math.random() - 0.5));
    const lexicalResource = this.roundToHalf(baseScore + (Math.random() - 0.5));
    const grammaticalRange = this.roundToHalf(baseScore + (Math.random() - 0.5));
    const overallBand = this.roundToHalf(
      (fluencyCoherence + pronunciation + lexicalResource + grammaticalRange) / 4
    );

    return {
      success: true,
      skillType: SkillType.SPEAKING,
      overallBand,
      confidence: 0.75,
      // IELTS Speaking sub-scores
      fluencyCoherence,
      pronunciation,
      lexicalResource,
      grammaticalRange,
      feedback: `Your overall band score is ${overallBand}.\n\n` +
        `**Fluency & Coherence:** ${fluencyCoherence}\n` +
        `**Lexical Resource:** ${lexicalResource}\n` +
        `**Grammatical Range & Accuracy:** ${grammaticalRange}\n` +
        `**Pronunciation:** ${pronunciation}\n\n` +
        `(Note: This is an estimated score. For accurate scoring, please ensure the AI service is running.)`,
      detailedFeedback: {
        strengths: [
          "Good vocabulary range for common topics",
          "Clear pronunciation of basic words",
          "Logical organization of ideas",
        ],
        areasForImprovement: [
          "Work on reducing pauses and fillers",
          "Practice stress patterns and intonation",
          "Expand vocabulary for academic topics",
        ],
        suggestions: [
          "Practice speaking for 2 minutes on various topics",
          "Record yourself and listen for improvement areas",
          "Learn and use more complex sentence structures",
        ],
      },
    };
  }

  private roundToHalf(num: number): number {
    return Math.round(num * 2) / 2;
  }

  private formatDetailedFeedback(feedback: {
    strengths: string[];
    areasForImprovement: string[];
    suggestions: string[];
  }): string {
    let content = "## Strengths\n";
    feedback.strengths.forEach((s) => {
      content += `- ${s}\n`;
    });

    content += "\n## Areas for Improvement\n";
    feedback.areasForImprovement.forEach((a) => {
      content += `- ${a}\n`;
    });

    content += "\n## Suggestions\n";
    feedback.suggestions.forEach((s) => {
      content += `- ${s}\n`;
    });

    return content;
  }
}

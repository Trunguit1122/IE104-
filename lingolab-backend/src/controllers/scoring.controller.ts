import {
  Controller,
  Post,
  Get,
  Route,
  Path,
  Response,
  Tags,
  Security,
  Request,
} from "tsoa";
import { Request as ExpressRequest } from "express";
import { ScoringService } from "../services/scoring.service";
import { Score } from "../entities/Score";
import { AttemptStatus } from "../entities/Attempt";
import { Messages } from "../constants/messages";

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

import { SkillType } from "../entities/Prompt";

/**
 * Scoring Result Response DTO
 * BR35: AI score, feedback text, timestamp
 * BR53: Feedback sections (Strengths, Areas for Improvement, Suggestions)
 */
interface ScoringResultResponse {
  success: boolean;
  status?: AttemptStatus;
  score?: {
    skillType: SkillType;
    overallBand: number;
    confidence?: number;
    subScores: {
      label: string;
      value: number;
    }[];
    feedback: string;
    detailedFeedback?: {
      strengths: string[];
      areasForImprovement: string[];
      suggestions: string[];
    };
    createdAt: Date;
  };
  message?: string;
}

@Route("/api/scoring")
@Tags("Scoring")
export class ScoringController extends Controller {
  private scoringService = new ScoringService();

  /**
   * UC23: Get AI Scoring Result
   * BR53: Feedback sections (Strengths, Areas for Improvement, Suggestions)
   * BR54: Error handling with re-scoring option
   */
  @Get("result/{attemptId}")
  @Security("jwt")
  @Response<ScoringResultResponse>(200, "Scoring result retrieved")
  @Response(404, "Attempt not found")
  async getScoringResult(
    @Request() request: AuthenticatedRequest,
    @Path() attemptId: string
  ): Promise<ScoringResultResponse> {
    const result = await this.scoringService.getScoringResult(attemptId);

    if (!result.success && result.message === Messages.MSG_404) {
      this.setStatus(404);
      return { success: false, message: result.message };
    }

    if (result.score) {
      return {
        success: true,
        status: result.status,
        score: {
          skillType: result.score.skillType,
          overallBand: Number(result.score.overallBand),
          confidence: result.score.confidence ? Number(result.score.confidence) : undefined,
          subScores: result.score.getSubScoresForChart(),
          feedback: result.score.feedback,
          detailedFeedback: result.score.detailedFeedback,
          createdAt: result.score.createdAt,
        },
      };
    }

    return {
      success: result.success,
      status: result.status,
      message: result.message,
    };
  }

  /**
   * Request re-scoring for a failed attempt
   * BR54: Allow learners to request re-scoring
   */
  @Post("rescore/{attemptId}")
  @Security("jwt")
  @Response(200, "Re-scoring requested")
  @Response(400, "Cannot re-score this attempt")
  @Response(404, "Attempt not found")
  async requestRescore(
    @Request() request: AuthenticatedRequest,
    @Path() attemptId: string
  ): Promise<{ success: boolean; message: string; jobId?: string }> {
    const result = await this.scoringService.requestRescore(attemptId);

    if (!result.success) {
      if (result.message === Messages.MSG_404) {
        this.setStatus(404);
      } else {
        this.setStatus(400);
      }
    }

    return result;
  }

  /**
   * Process pending scoring jobs (Admin/System only)
   * This endpoint would typically be called by a background job scheduler
   */
  @Post("process-jobs")
  @Security("jwt", ["admin"])
  @Response(200, "Jobs processed")
  async processJobs(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    const pendingJobs = await this.scoringService.getPendingJobs(10);
    
    let successful = 0;
    let failed = 0;

    for (const job of pendingJobs) {
      const result = await this.scoringService.processScoringJob(job.id);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    return {
      processed: pendingJobs.length,
      successful,
      failed,
    };
  }

  /**
   * Manually trigger scoring for a specific job (for testing/debugging)
   */
  @Post("trigger-job/{jobId}")
  @Response(200, "Job triggered")
  @Response(404, "Job not found")
  async triggerJob(
    @Path() jobId: string
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.scoringService.processScoringJob(jobId);
    return result;
  }
}


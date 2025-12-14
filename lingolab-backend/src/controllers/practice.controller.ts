import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Route,
  Body,
  Path,
  Query,
  Response,
  Tags,
  Security,
  Request,
} from "tsoa";
import { Request as ExpressRequest } from "express";
import { PracticeService } from "../services/practice.service";
import {
  StartSpeakingPracticeDTO,
  StartWritingPracticeDTO,
  PracticeSessionResponseDTO,
  RenameRecordingDTO,
  RecordingResponseDTO,
  SaveWritingContentDTO,
  WritingContentResponseDTO,
  SubmitSpeakingAttemptDTO,
  SubmitWritingAttemptDTO,
  SubmitAttemptResponseDTO,
  PracticeHistoryFilterDTO,
  PracticeHistoryResponseDTO,
  CompareAttemptsDTO,
  CompareAttemptsResponseDTO,
  RetakePracticeDTO,
  RetakePracticeResponseDTO,
  PromptListFilterDTO,
  PromptListResponseDTO,
} from "../dtos/practice.dto";
import { Messages } from "../constants/messages";
import { SkillType, DifficultyLevel } from "../entities/Prompt";
import { AttemptStatus } from "../entities/Attempt";

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

@Route("/api/practice")
@Tags("Practice")
export class PracticeController extends Controller {
  private practiceService = new PracticeService();

  // ============ Prompt List (UC6) ============

  /**
   * UC6: Get Practice Prompt List
   * BR17: Filter by Topic, Difficulty
   * BR18: Search minimum 3 characters
   * BR19: Default sorting "Newest First"
   */
  @Get("prompts")
  @Security("jwt")
  @Response<PromptListResponseDTO>(200, "Prompt list retrieved")
  async getPromptList(
    @Query() skillType?: SkillType,
    @Query() topicId?: string,
    @Query() difficulty?: DifficultyLevel,
    @Query() search?: string,
    @Query() sortBy?: "newest" | "oldest" | "difficulty" | "popular",
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PromptListResponseDTO> {
    return await this.practiceService.getPromptList({
      skillType,
      topicId,
      difficulty,
      search,
      sortBy,
      limit,
      offset,
    });
  }

  // ============ Speaking Practice (UC7, UC8, UC9, UC10) ============

  /**
   * UC7: Start Speaking Practice
   * BR20: Generate unique SessionID
   * BR21: Preparation timer starts
   */
  @Post("speaking/start")
  @Security("jwt")
  @Response<PracticeSessionResponseDTO>(201, "Speaking session started")
  @Response(400, "Invalid request")
  @Response(401, "Unauthorized")
  async startSpeakingPractice(
    @Request() request: AuthenticatedRequest,
    @Body() dto: StartSpeakingPracticeDTO
  ): Promise<PracticeSessionResponseDTO> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const result = await this.practiceService.startSpeakingPractice(userId, dto);
    if (result.success) {
      this.setStatus(201);
    } else {
      this.setStatus(400);
    }
    return result;
  }

  /**
   * Get recordings for an attempt
   */
  @Get("speaking/{attemptId}/recordings")
  @Security("jwt")
  @Response<RecordingResponseDTO[]>(200, "Recordings retrieved")
  async getAttemptRecordings(
    @Request() request: AuthenticatedRequest,
    @Path() attemptId: string
  ): Promise<RecordingResponseDTO[]> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return [];
    }

    return await this.practiceService.getAttemptRecordings(userId, attemptId);
  }

  /**
   * UC9: Rename Recording
   * BR25: Filename validation
   */
  @Put("speaking/recordings/{mediaId}")
  @Security("jwt")
  @Response<RecordingResponseDTO>(200, "Recording renamed")
  @Response(400, "Invalid filename")
  async renameRecording(
    @Request() request: AuthenticatedRequest,
    @Path() mediaId: string,
    @Body() dto: RenameRecordingDTO
  ): Promise<RecordingResponseDTO | { success: false; message: string }> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const result = await this.practiceService.renameRecording(userId, mediaId, dto);
    if ("success" in result && !result.success) {
      this.setStatus(400);
    }
    return result;
  }

  /**
   * UC9: Delete Recording
   * BR26: Immediate removal
   */
  @Delete("speaking/recordings/{mediaId}")
  @Security("jwt")
  @Response(200, "Recording deleted")
  @Response(404, "Recording not found")
  async deleteRecording(
    @Request() request: AuthenticatedRequest,
    @Path() mediaId: string
  ): Promise<{ success: boolean; message: string }> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const result = await this.practiceService.deleteRecording(userId, mediaId);
    if (!result.success) {
      this.setStatus(404);
    }
    return result;
  }

  /**
   * UC10: Submit Speaking Attempt
   * BR27: Must select recording
   * BR28: API timeout 30 seconds
   * BR29: Status update to Processing
   */
  @Post("speaking/submit")
  @Security("jwt")
  @Response<SubmitAttemptResponseDTO>(200, "Attempt submitted")
  @Response(400, "Invalid submission")
  async submitSpeakingAttempt(
    @Request() request: AuthenticatedRequest,
    @Body() dto: SubmitSpeakingAttemptDTO
  ): Promise<SubmitAttemptResponseDTO> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return {
        success: false,
        message: Messages.MSG_401,
        attemptId: dto.attemptId,
        status: AttemptStatus.IN_PROGRESS,
      };
    }

    const result = await this.practiceService.submitSpeakingAttempt(userId, dto);
    if (!result.success) {
      this.setStatus(400);
    }
    return result;
  }

  // ============ Writing Practice (UC20, UC21, UC22) ============

  /**
   * UC20: Start Writing Practice
   * BR46: Generate unique AttemptID
   * BR47: Display task description, word count
   * BR48: Check concurrent session
   */
  @Post("writing/start")
  @Security("jwt")
  @Response<PracticeSessionResponseDTO>(201, "Writing session started")
  @Response(400, "Invalid request or concurrent session exists")
  @Response(401, "Unauthorized")
  async startWritingPractice(
    @Request() request: AuthenticatedRequest,
    @Body() dto: StartWritingPracticeDTO
  ): Promise<PracticeSessionResponseDTO> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const result = await this.practiceService.startWritingPractice(userId, dto);
    if (result.success) {
      this.setStatus(201);
    } else {
      this.setStatus(400);
    }
    return result;
  }

  /**
   * Get active writing session
   */
  @Get("writing/active")
  @Security("jwt")
  @Response(200, "Active session found or null")
  async getActiveWritingSession(
    @Request() request: AuthenticatedRequest
  ): Promise<PracticeSessionResponseDTO | null> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return null;
    }

    const session = await this.practiceService.getActiveWritingSession(userId);
    if (!session) {
      return null;
    }

    return {
      success: true,
      attemptId: session.id,
      promptId: session.promptId,
      promptContent: session.prompt?.content,
      skillType: session.skillType,
      startedAt: session.startedAt,
      minWordCount: session.prompt?.minWordCount || 250,
    };
  }

  /**
   * UC21: Save Writing Content
   * BR49: Autosave every 30 seconds
   * BR50: Real-time word count
   */
  @Put("writing/{attemptId}/content")
  @Security("jwt")
  @Response<WritingContentResponseDTO>(200, "Content saved")
  @Response(400, "Invalid request")
  async saveWritingContent(
    @Request() request: AuthenticatedRequest,
    @Path() attemptId: string,
    @Body() dto: SaveWritingContentDTO
  ): Promise<WritingContentResponseDTO> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return {
        success: false,
        message: Messages.MSG_401,
        attemptId,
        wordCount: 0,
        meetsMinimumWords: false,
      };
    }

    const result = await this.practiceService.saveWritingContent(userId, attemptId, dto);
    if (!result.success) {
      this.setStatus(400);
    }
    return result;
  }

  /**
   * UC22: Submit Writing Attempt
   * BR51: Minimum words check
   * BR52: API timeout 60 seconds
   */
  @Post("writing/submit")
  @Security("jwt")
  @Response<SubmitAttemptResponseDTO>(200, "Attempt submitted")
  @Response(400, "Invalid submission or word count too low")
  async submitWritingAttempt(
    @Request() request: AuthenticatedRequest,
    @Body() dto: SubmitWritingAttemptDTO
  ): Promise<SubmitAttemptResponseDTO> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return {
        success: false,
        message: Messages.MSG_401,
        attemptId: dto.attemptId,
        status: AttemptStatus.IN_PROGRESS,
      };
    }

    const result = await this.practiceService.submitWritingAttempt(userId, dto);
    if (!result.success) {
      this.setStatus(400);
    }
    return result;
  }

  // ============ Session Management ============

  /**
   * Cancel active session
   */
  @Delete("session/{attemptId}")
  @Security("jwt")
  @Response(200, "Session cancelled")
  @Response(404, "Session not found")
  async cancelSession(
    @Request() request: AuthenticatedRequest,
    @Path() attemptId: string
  ): Promise<{ success: boolean; message: string }> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const result = await this.practiceService.cancelSession(userId, attemptId);
    if (!result.success) {
      this.setStatus(404);
    }
    return result;
  }

  // ============ Practice History (UC24) ============

  /**
   * UC24: Get Practice History
   * BR55: Default descending order
   * BR56: Filter options
   * BR57: 10 items per page
   */
  @Get("history")
  @Security("jwt")
  @Response<PracticeHistoryResponseDTO>(200, "Practice history retrieved")
  async getPracticeHistory(
    @Request() request: AuthenticatedRequest,
    @Query() skillType?: SkillType,
    @Query() dateFrom?: string,
    @Query() dateTo?: string,
    @Query() scoreMin?: number,
    @Query() scoreMax?: number,
    @Query() status?: AttemptStatus,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PracticeHistoryResponseDTO> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return {
        items: [],
        total: 0,
        limit,
        offset,
        hasMore: false,
      };
    }

    return await this.practiceService.getPracticeHistory(userId, {
      skillType,
      dateFrom,
      dateTo,
      scoreMin,
      scoreMax,
      status,
      limit,
      offset,
    });
  }

  // ============ Compare Attempts (UC25) ============

  /**
   * UC25: Compare Practice Attempts
   * BR58: Minimum 2 attempts
   * BR59: Maximum 5 attempts
   * BR60: Same skill type only
   * BR61-BR62: Visualization data
   */
  @Post("compare")
  @Security("jwt")
  @Response<CompareAttemptsResponseDTO>(200, "Comparison generated")
  @Response(400, "Invalid selection")
  async compareAttempts(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CompareAttemptsDTO
  ): Promise<CompareAttemptsResponseDTO> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const result = await this.practiceService.compareAttempts(userId, dto);
    if (!result.success) {
      this.setStatus(400);
    }
    return result;
  }

  // ============ Retake Practice (UC26) ============

  /**
   * UC26: Retake Practice
   * BR63: Prompt must be available
   */
  @Post("retake")
  @Security("jwt")
  @Response<RetakePracticeResponseDTO>(201, "New attempt started")
  @Response(400, "Cannot retake - prompt unavailable")
  async retakePractice(
    @Request() request: AuthenticatedRequest,
    @Body() dto: RetakePracticeDTO
  ): Promise<RetakePracticeResponseDTO> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const result = await this.practiceService.retakePractice(userId, dto);
    if (result.success) {
      this.setStatus(201);
    } else {
      this.setStatus(400);
    }
    return result;
  }
}


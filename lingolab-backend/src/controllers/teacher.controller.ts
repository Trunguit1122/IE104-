import {
  Controller,
  Post,
  Get,
  Put,
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
import { TeacherService } from "../services/teacher.service";
import {
  LearnerListFilterDTO,
  LearnerListResponseDTO,
  LearnerProfileDTO,
  TeacherPracticeHistoryFilterDTO,
  TeacherPracticeHistoryItemDTO,
  AttemptDetailDTO,
  AddTeacherEvaluationDTO,
  TeacherEvaluationResponseDTO,
  SuggestTopicsDTO,
  TopicSuggestionsResponseDTO,
  ProgressFilterDTO,
  ProgressResponseDTO,
  ExportReportDTO,
  ExportResponseDTO,
  CreateClassDTO,
  ClassResponseDTO,
  ClassDetailDTO,
  AddLearnersToClassDTO,
} from "../dtos/teacher.dto";
import { Messages } from "../constants/messages";
import { UserStatus } from "../entities/User";
import { SkillType } from "../entities/Prompt";
import { AttemptStatus } from "../entities/Attempt";

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

@Route("/api/teacher")
@Tags("Teacher")
export class TeacherController extends Controller {
  private teacherService = new TeacherService();

  // ============ Learner List (UC11, UC12) ============

  /**
   * UC11: View Learner List
   * BR30: 50 students per page
   */
  @Get("learners")
  @Security("jwt", ["teacher", "admin"])
  @Response<LearnerListResponseDTO>(200, "Learner list retrieved")
  @Response(401, "Unauthorized")
  @Response(403, "Forbidden - Teacher role required")
  async getLearnerList(
    @Request() request: AuthenticatedRequest,
    @Query() search?: string,
    @Query() classId?: string,
    @Query() status?: UserStatus,
    @Query() limit: number = 50,
    @Query() offset: number = 0
  ): Promise<LearnerListResponseDTO> {
    const teacherId = request.user?.userId;
    if (!teacherId) {
      this.setStatus(401);
      return {
        items: [],
        total: 0,
        limit,
        offset,
        hasMore: false,
      };
    }

    return await this.teacherService.getLearnerList(teacherId, {
      search,
      classId,
      status,
      limit,
      offset,
    });
  }

  // ============ Learner Profile (UC13) ============

  /**
   * UC13: View Learner Profile
   * BR33: Access permission check
   */
  @Get("learners/{learnerId}")
  @Security("jwt", ["teacher", "admin"])
  @Response<LearnerProfileDTO>(200, "Learner profile retrieved")
  @Response(403, "Forbidden - No access to this learner")
  @Response(404, "Learner not found")
  async getLearnerProfile(
    @Request() request: AuthenticatedRequest,
    @Path() learnerId: string
  ): Promise<LearnerProfileDTO | { success: false; message: string }> {
    const teacherId = request.user?.userId;
    if (!teacherId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const result = await this.teacherService.getLearnerProfile(teacherId, learnerId);
    if ("success" in result && !result.success) {
      this.setStatus(result.message === Messages.MSG_020 ? 403 : 404);
    }
    return result;
  }

  // ============ Practice History (UC14) ============

  /**
   * UC14: View Learner Practice History
   * BR34: Sort by date (most recent first)
   */
  @Get("learners/{learnerId}/history")
  @Security("jwt", ["teacher", "admin"])
  @Response<{ success: boolean; items: TeacherPracticeHistoryItemDTO[] }>(
    200,
    "Practice history retrieved"
  )
  @Response(403, "Forbidden")
  async getLearnerPracticeHistory(
    @Request() request: AuthenticatedRequest,
    @Path() learnerId: string,
    @Query() skillType?: SkillType,
    @Query() dateFrom?: string,
    @Query() dateTo?: string,
    @Query() status?: AttemptStatus,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<{ success: boolean; items?: TeacherPracticeHistoryItemDTO[]; message?: string }> {
    const teacherId = request.user?.userId;
    if (!teacherId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const result = await this.teacherService.getLearnerPracticeHistory(teacherId, {
      learnerId,
      skillType,
      dateFrom,
      dateTo,
      status,
      limit,
      offset,
    });

    if (!result.success) {
      this.setStatus(403);
    }
    return result;
  }

  // ============ Attempt Details (UC15) ============

  /**
   * UC15: View Attempt Details
   * BR35: AI feedback display
   */
  @Get("attempts/{attemptId}")
  @Security("jwt", ["teacher", "admin"])
  @Response<AttemptDetailDTO>(200, "Attempt details retrieved")
  @Response(403, "Forbidden")
  @Response(404, "Attempt not found")
  async getAttemptDetail(
    @Request() request: AuthenticatedRequest,
    @Path() attemptId: string
  ): Promise<AttemptDetailDTO | { success: false; message: string }> {
    const teacherId = request.user?.userId;
    if (!teacherId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const result = await this.teacherService.getAttemptDetail(teacherId, attemptId);
    if ("success" in result && !result.success) {
      this.setStatus(result.message === Messages.MSG_020 ? 403 : 404);
    }
    return result;
  }

  // ============ Teacher Evaluation (UC16) ============

  /**
   * UC16: Add Teacher Evaluation
   * BR36: Score 0.0-9.0, step 0.5
   * BR37: Comment max 2000 chars
   * BR38: Update status, notify student
   */
  @Post("attempts/{attemptId}/evaluate")
  @Security("jwt", ["teacher", "admin"])
  @Response<TeacherEvaluationResponseDTO>(200, "Evaluation saved")
  @Response(400, "Invalid score or comment")
  @Response(403, "Forbidden")
  async addTeacherEvaluation(
    @Request() request: AuthenticatedRequest,
    @Path() attemptId: string,
    @Body() dto: Omit<AddTeacherEvaluationDTO, "attemptId">
  ): Promise<TeacherEvaluationResponseDTO> {
    const teacherId = request.user?.userId;
    if (!teacherId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const result = await this.teacherService.addTeacherEvaluation(teacherId, {
      ...dto,
      attemptId,
    });

    if (!result.success) {
      if (result.message === Messages.MSG_020) {
        this.setStatus(403);
      } else {
        this.setStatus(400);
      }
    }
    return result;
  }

  // ============ Suggest Topics (UC17) ============

  /**
   * UC17: Suggest Practice Topics
   * BR39: Level matching based on band score
   */
  @Get("learners/{learnerId}/suggestions")
  @Security("jwt", ["teacher", "admin"])
  @Response<TopicSuggestionsResponseDTO>(200, "Suggestions generated")
  @Response(403, "Forbidden")
  async suggestTopics(
    @Request() request: AuthenticatedRequest,
    @Path() learnerId: string,
    @Query() skillType?: SkillType
  ): Promise<TopicSuggestionsResponseDTO> {
    const teacherId = request.user?.userId;
    if (!teacherId) {
      this.setStatus(401);
      return {
        success: false,
        suggestedDifficulty: "medium" as any,
        suggestions: [],
      };
    }

    return await this.teacherService.suggestTopics(teacherId, {
      learnerId,
      skillType,
    });
  }

  // ============ Learner Progress (UC18) ============

  /**
   * UC18: Monitor Learner Progress
   * BR40: Weekly/Monthly toggle
   * BR41: Average Score Trend, Total Attempts
   */
  @Get("learners/{learnerId}/progress")
  @Security("jwt", ["teacher", "admin"])
  @Response<ProgressResponseDTO>(200, "Progress data retrieved")
  @Response(403, "Forbidden")
  async getProgress(
    @Request() request: AuthenticatedRequest,
    @Path() learnerId: string,
    @Query() period: "weekly" | "monthly" = "weekly",
    @Query() skillType?: SkillType
  ): Promise<ProgressResponseDTO> {
    const teacherId = request.user?.userId;
    if (!teacherId) {
      this.setStatus(401);
      return {
        success: false,
        learnerId,
        period,
        totalAttempts: 0,
        avgScoreTrend: [],
      };
    }

    return await this.teacherService.getProgress(teacherId, {
      learnerId,
      period,
      skillType,
    });
  }

  // ============ Export Reports (UC19) ============

  /**
   * UC19: Export Learner Reports
   * BR42: PDF or XLSX format
   * BR43: Naming convention
   * BR44: Timeout handling
   * BR45: Empty data handling
   */
  @Post("learners/{learnerId}/export")
  @Security("jwt", ["teacher", "admin"])
  @Response<ExportResponseDTO>(200, "Report generated")
  @Response(400, "No data available")
  @Response(403, "Forbidden")
  async exportReport(
    @Request() request: AuthenticatedRequest,
    @Path() learnerId: string,
    @Body() dto: Omit<ExportReportDTO, "learnerId">
  ): Promise<ExportResponseDTO> {
    const teacherId = request.user?.userId;
    if (!teacherId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const result = await this.teacherService.exportReport(teacherId, {
      ...dto,
      learnerId,
    });

    if (!result.success) {
      if (result.message === Messages.MSG_022) {
        this.setStatus(400);
      } else if (result.message === Messages.MSG_020) {
        this.setStatus(403);
      }
    }
    return result;
  }

  // ============ Class Management ============

  /**
   * Create a new class
   */
  @Post("classes")
  @Security("jwt", ["teacher", "admin"])
  @Response<ClassResponseDTO>(201, "Class created")
  async createClass(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CreateClassDTO
  ): Promise<ClassResponseDTO | { success: false; message: string }> {
    const teacherId = request.user?.userId;
    if (!teacherId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const result = await this.teacherService.createClass(teacherId, dto);
    this.setStatus(201);
    return result;
  }

  /**
   * Get teacher's classes
   */
  @Get("classes")
  @Security("jwt", ["teacher", "admin"])
  @Response<ClassResponseDTO[]>(200, "Classes retrieved")
  async getTeacherClasses(
    @Request() request: AuthenticatedRequest
  ): Promise<ClassResponseDTO[]> {
    const teacherId = request.user?.userId;
    if (!teacherId) {
      this.setStatus(401);
      return [];
    }

    return await this.teacherService.getTeacherClasses(teacherId);
  }

  /**
   * Add learners to a class
   */
  @Post("classes/{classId}/learners")
  @Security("jwt", ["teacher", "admin"])
  @Response(200, "Learners added")
  @Response(404, "Class not found")
  async addLearnersToClass(
    @Request() request: AuthenticatedRequest,
    @Path() classId: string,
    @Body() dto: AddLearnersToClassDTO
  ): Promise<{ success: boolean; message: string }> {
    const teacherId = request.user?.userId;
    if (!teacherId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    const result = await this.teacherService.addLearnersToClass(
      teacherId,
      classId,
      dto.learnerIds
    );

    if (!result.success) {
      this.setStatus(404);
    }
    return result;
  }
}


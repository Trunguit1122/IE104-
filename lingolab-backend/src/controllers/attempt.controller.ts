import { Controller, Get, Post, Put, Delete, Route, Body, Path, Query, Response, Tags, Security, Request } from "tsoa";
import {
  CreateAttemptDTO,
  UpdateAttemptDTO,
  SubmitAttemptDTO,
  AttemptResponseDTO,
  AttemptListDTO,
  AttemptDetailDTO,
  AttemptFilterDTO,
} from "../dtos/attempt.dto";
import { AttemptService } from "../services/attempt.service";
import { SkillType } from "../entities/Prompt";
import { AttemptStatus } from "../entities/Attempt";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { UserRole } from "../entities/User";

@Route("/api/attempts")
@Tags("Attempt")
export class AttemptController extends Controller {
  private attemptService = new AttemptService();

  /**
   * Create a new attempt
   */
  @Post()
  @Security("jwt")
  @Response(201, "Attempt created successfully")
  async createAttempt(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CreateAttemptDTO
  ): Promise<AttemptResponseDTO> {
    // Force learnerId to be the authenticated user for security
    const secureDto = { ...dto, learnerId: request.user!.userId };
    return await this.attemptService.createAttempt(secureDto);
  }

  /**
   * Get attempt by ID
   * Teachers can view all attempts, students can only view their own
   */
  @Get("{id}")
  @Security("jwt")
  @Response(200, "Attempt found")
  @Response(404, "Attempt not found")
  @Response(403, "Forbidden")
  async getAttemptById(
    @Request() request: AuthenticatedRequest,
    @Path() id: string
  ): Promise<AttemptDetailDTO | { success: false; message: string }> {
    const attempt = await this.attemptService.getAttemptById(id);
    
    // Teachers can view all attempts
    if (request.user!.role === UserRole.TEACHER || request.user!.role === UserRole.ADMIN) {
      return attempt;
    }
    
    // Students can only view their own attempts
    if (attempt.learnerId !== request.user!.userId) {
      this.setStatus(403);
      return { success: false, message: "You can only view your own attempts" };
    }
    
    return attempt;
  }

  /**
   * Get all attempts with pagination (Teachers/Admins only)
   */
  @Get()
  @Security("jwt")
  async getAllAttempts(
    @Request() request: AuthenticatedRequest,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<AttemptListDTO>> {
    // For students, only return their own attempts
    if (request.user!.role === UserRole.LEARNER) {
      return await this.attemptService.getAttemptsByLearner(request.user!.userId, limit, offset);
    }
    return await this.attemptService.getAllAttempts(limit, offset);
  }

  /**
   * Get attempts by learner
   */
  @Get("learner/{learnerId}")
  @Security("jwt")
  async getAttemptsByLearner(
    @Request() request: AuthenticatedRequest,
    @Path() learnerId: string,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<AttemptListDTO> | { success: false; message: string }> {
    // Students can only view their own attempts
    if (request.user!.role === UserRole.LEARNER && learnerId !== request.user!.userId) {
      this.setStatus(403);
      return { success: false, message: "You can only view your own attempts" } as any;
    }
    return await this.attemptService.getAttemptsByLearner(learnerId, limit, offset);
  }

  /**
   * Get attempts by learner and status
   */
  @Get("learner/{learnerId}/status/{status}")
  @Security("jwt")
  async getAttemptsByLearnerAndStatus(
    @Request() request: AuthenticatedRequest,
    @Path() learnerId: string,
    @Path() status: AttemptStatus,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<AttemptListDTO> | { success: false; message: string }> {
    // Students can only view their own attempts
    if (request.user!.role === UserRole.LEARNER && learnerId !== request.user!.userId) {
      this.setStatus(403);
      return { success: false, message: "You can only view your own attempts" } as any;
    }
    return await this.attemptService.getAttemptsByLearnerAndStatus(learnerId, status, limit, offset);
  }

  /**
   * Get attempts by prompt (Teachers/Admins only)
   */
  @Get("prompt/{promptId}")
  @Security("jwt")
  async getAttemptsByPrompt(
    @Request() request: AuthenticatedRequest,
    @Path() promptId: string,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<AttemptListDTO> | { success: false; message: string }> {
    // Only teachers/admins can view attempts by prompt
    if (request.user!.role === UserRole.LEARNER) {
      this.setStatus(403);
      return { success: false, message: "Access denied" } as any;
    }
    return await this.attemptService.getAttemptsByPrompt(promptId, limit, offset);
  }

  /**
   * Get attempts by status (Teachers/Admins only)
   */
  @Get("by-status/{status}")
  @Security("jwt")
  async getAttemptsByStatus(
    @Request() request: AuthenticatedRequest,
    @Path() status: AttemptStatus,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<AttemptListDTO> | { success: false; message: string }> {
    // Only teachers/admins can view all attempts by status
    if (request.user!.role === UserRole.LEARNER) {
      this.setStatus(403);
      return { success: false, message: "Access denied" } as any;
    }
    return await this.attemptService.getAttemptsByStatus(status, limit, offset);
  }

  /**
   * Get attempts by skill type (Teachers/Admins only)
   */
  @Get("by-skill/{skillType}")
  @Security("jwt")
  async getAttemptsBySkillType(
    @Request() request: AuthenticatedRequest,
    @Path() skillType: SkillType,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<AttemptListDTO> | { success: false; message: string }> {
    // Only teachers/admins can view all attempts by skill
    if (request.user!.role === UserRole.LEARNER) {
      this.setStatus(403);
      return { success: false, message: "Access denied" } as any;
    }
    return await this.attemptService.getAttemptsBySkillType(skillType, limit, offset);
  }

  /**
   * Get attempts with filter (requires learnerId)
   */
  @Post("learner/{learnerId}/filter")
  @Security("jwt")
  async getAttemptsByFilter(
    @Request() request: AuthenticatedRequest,
    @Path() learnerId: string,
    @Body() filter: AttemptFilterDTO
  ): Promise<PaginatedResponseDTO<AttemptListDTO> | { success: false; message: string }> {
    // Students can only filter their own attempts
    if (request.user!.role === UserRole.LEARNER && learnerId !== request.user!.userId) {
      this.setStatus(403);
      return { success: false, message: "You can only view your own attempts" } as any;
    }
    return await this.attemptService.getAttemptsByFilter(learnerId, filter);
  }

  /**
   * Submit an attempt (owner only)
   */
  @Put("{id}/submit")
  @Security("jwt")
  @Response(200, "Attempt submitted successfully")
  @Response(404, "Attempt not found")
  @Response(403, "Forbidden")
  async submitAttempt(
    @Request() request: AuthenticatedRequest,
    @Path() id: string,
    @Body() dto: SubmitAttemptDTO
  ): Promise<AttemptResponseDTO | { success: false; message: string }> {
    // Check ownership before submit
    const attempt = await this.attemptService.getAttemptById(id);
    if (request.user!.role === UserRole.LEARNER && attempt.learnerId !== request.user!.userId) {
      this.setStatus(403);
      return { success: false, message: "You can only submit your own attempts" } as any;
    }
    return await this.attemptService.submitAttempt(id, dto);
  }

  /**
   * Update attempt (owner only)
   */
  @Put("{id}")
  @Security("jwt")
  @Response(200, "Attempt updated successfully")
  @Response(404, "Attempt not found")
  @Response(403, "Forbidden")
  async updateAttempt(
    @Request() request: AuthenticatedRequest,
    @Path() id: string,
    @Body() dto: UpdateAttemptDTO
  ): Promise<AttemptResponseDTO | { success: false; message: string }> {
    // Check ownership before update
    const attempt = await this.attemptService.getAttemptById(id);
    if (request.user!.role === UserRole.LEARNER && attempt.learnerId !== request.user!.userId) {
      this.setStatus(403);
      return { success: false, message: "You can only update your own attempts" } as any;
    }
    return await this.attemptService.updateAttempt(id, dto);
  }

  /**
   * Get attempt count by learner
   */
  @Get("learner/{learnerId}/count")
  @Security("jwt")
  async getAttemptCountByLearner(
    @Request() request: AuthenticatedRequest,
    @Path() learnerId: string
  ): Promise<{ count: number } | { success: false; message: string }> {
    if (request.user!.role === UserRole.LEARNER && learnerId !== request.user!.userId) {
      this.setStatus(403);
      return { success: false, message: "Access denied" } as any;
    }
    const count = await this.attemptService.getAttemptCountByLearner(learnerId);
    return { count };
  }

  /**
   * Get submitted attempts count by learner
   */
  @Get("learner/{learnerId}/submitted-count")
  @Security("jwt")
  async getSubmittedAttemptsCount(
    @Request() request: AuthenticatedRequest,
    @Path() learnerId: string
  ): Promise<{ count: number } | { success: false; message: string }> {
    if (request.user!.role === UserRole.LEARNER && learnerId !== request.user!.userId) {
      this.setStatus(403);
      return { success: false, message: "Access denied" } as any;
    }
    const count = await this.attemptService.getSubmittedAttemptsCount(learnerId);
    return { count };
  }

  /**
   * Get scored attempts count by learner
   */
  @Get("learner/{learnerId}/scored-count")
  @Security("jwt")
  async getScoredAttemptsCount(
    @Request() request: AuthenticatedRequest,
    @Path() learnerId: string
  ): Promise<{ count: number } | { success: false; message: string }> {
    if (request.user!.role === UserRole.LEARNER && learnerId !== request.user!.userId) {
      this.setStatus(403);
      return { success: false, message: "Access denied" } as any;
    }
    const count = await this.attemptService.getScoredAttemptsCount(learnerId);
    return { count };
  }

  /**
   * Delete attempt (owner or admin only)
   */
  @Delete("{id}")
  @Security("jwt")
  @Response(204, "Attempt deleted successfully")
  @Response(404, "Attempt not found")
  @Response(403, "Forbidden")
  async deleteAttempt(
    @Request() request: AuthenticatedRequest,
    @Path() id: string
  ): Promise<void | { success: false; message: string }> {
    // Check ownership before delete
    const attempt = await this.attemptService.getAttemptById(id);
    if (request.user!.role === UserRole.LEARNER && attempt.learnerId !== request.user!.userId) {
      this.setStatus(403);
      return { success: false, message: "You can only delete your own attempts" } as any;
    }
    await this.attemptService.deleteAttempt(id);
    this.setStatus(204);
  }
}

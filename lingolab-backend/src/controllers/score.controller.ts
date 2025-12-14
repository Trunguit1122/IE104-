import { Controller, Get, Post, Put, Delete, Route, Body, Path, Query, Response, Tags, Security, Request } from "tsoa";
import {
  CreateScoreDTO,
  UpdateScoreDTO,
  ScoreResponseDTO,
  ScoreListDTO,
  ScoreDetailDTO,
  ScorePaginationDTO,
} from "../dtos/score.dto";
import { ScoreService } from "../services/score.service";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { UserRole } from "../entities/User";

@Route("/api/scores")
@Tags("Score")
export class ScoreController extends Controller {
  private scoreService = new ScoreService();

  /**
   * Create a new score (System/Admin only)
   */
  @Post()
  @Security("jwt")
  @Response(201, "Score created successfully")
  @Response(403, "Forbidden")
  async createScore(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CreateScoreDTO
  ): Promise<ScoreResponseDTO | { success: false; message: string }> {
    // Only admins or system can create scores
    if (request.user!.role !== UserRole.ADMIN) {
      this.setStatus(403);
      return { success: false, message: "Only administrators can create scores directly" } as any;
    }
    return await this.scoreService.createScore(dto);
  }

  /**
   * Get score by ID
   */
  @Get("{id}")
  @Security("jwt")
  @Response(200, "Score found")
  @Response(404, "Score not found")
  async getScoreById(@Path() id: string): Promise<ScoreDetailDTO> {
    return await this.scoreService.getScoreById(id);
  }

  /**
   * Get score by attempt ID
   */
  @Get("attempt/{attemptId}")
  @Security("jwt")
  @Response(200, "Score found")
  @Response(404, "Score not found")
  async getScoreByAttemptId(@Path() attemptId: string): Promise<ScoreResponseDTO> {
    return await this.scoreService.getScoreByAttemptId(attemptId);
  }

  /**
   * Get all scores with pagination (Teachers/Admins only)
   */
  @Get()
  @Security("jwt")
  async getAllScores(
    @Request() request: AuthenticatedRequest,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<ScoreListDTO> | { success: false; message: string }> {
    if (request.user!.role === UserRole.LEARNER) {
      this.setStatus(403);
      return { success: false, message: "Access denied" } as any;
    }
    return await this.scoreService.getAllScores(limit, offset);
  }

  /**
   * Get scores by band (Teachers/Admins only)
   */
  @Get("by-band/{band}")
  @Security("jwt")
  async getScoresByBand(
    @Request() request: AuthenticatedRequest,
    @Path() band: number,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<ScoreListDTO> | { success: false; message: string }> {
    if (request.user!.role === UserRole.LEARNER) {
      this.setStatus(403);
      return { success: false, message: "Access denied" } as any;
    }
    return await this.scoreService.getScoresByBand(band, limit, offset);
  }

  /**
   * Get scores by band range (Teachers/Admins only)
   */
  @Get("by-band-range/{minBand}/{maxBand}")
  @Security("jwt")
  async getScoresByBandRange(
    @Request() request: AuthenticatedRequest,
    @Path() minBand: number,
    @Path() maxBand: number,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<ScoreListDTO> | { success: false; message: string }> {
    if (request.user!.role === UserRole.LEARNER) {
      this.setStatus(403);
      return { success: false, message: "Access denied" } as any;
    }
    return await this.scoreService.getScoresByBandRange(minBand, maxBand, limit, offset);
  }

  /**
   * Update score (Admin only)
   */
  @Put("{id}")
  @Security("jwt")
  @Response(200, "Score updated successfully")
  @Response(404, "Score not found")
  @Response(403, "Forbidden")
  async updateScore(
    @Request() request: AuthenticatedRequest,
    @Path() id: string,
    @Body() dto: UpdateScoreDTO
  ): Promise<ScoreResponseDTO | { success: false; message: string }> {
    if (request.user!.role !== UserRole.ADMIN) {
      this.setStatus(403);
      return { success: false, message: "Only administrators can update scores" } as any;
    }
    return await this.scoreService.updateScore(id, dto);
  }

  /**
   * Get average band statistics
   * - Learners see their own stats
   * - Teachers/Admins see overall system stats
   */
  @Get("stats/average-band")
  @Security("jwt")
  async getAverageBand(
    @Request() request: AuthenticatedRequest
  ): Promise<{
    averageBand: number | null;
    totalScores: number;
    bySkillType: { speaking?: number; writing?: number };
  } | { success: false; message: string }> {
    const userId = request.user!.role === UserRole.LEARNER ? request.user!.userId : undefined;
    const stats = await this.scoreService.getAverageBand(userId);
    return stats;
  }

  /**
   * Get score distribution (Teachers/Admins only)
   */
  @Get("stats/distribution")
  @Security("jwt")
  async getScoreDistribution(
    @Request() request: AuthenticatedRequest
  ): Promise<Record<number, number> | { success: false; message: string }> {
    if (request.user!.role === UserRole.LEARNER) {
      this.setStatus(403);
      return { success: false, message: "Access denied" } as any;
    }
    return await this.scoreService.getScoreDistribution();
  }

  /**
   * Delete score (Admin only)
   */
  @Delete("{id}")
  @Security("jwt")
  @Response(204, "Score deleted successfully")
  @Response(404, "Score not found")
  @Response(403, "Forbidden")
  async deleteScore(
    @Request() request: AuthenticatedRequest,
    @Path() id: string
  ): Promise<void | { success: false; message: string }> {
    if (request.user!.role !== UserRole.ADMIN) {
      this.setStatus(403);
      return { success: false, message: "Only administrators can delete scores" } as any;
    }
    await this.scoreService.deleteScore(id);
    this.setStatus(204);
  }
}

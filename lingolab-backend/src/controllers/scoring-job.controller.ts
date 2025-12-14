import { Controller, Get, Post, Put, Delete, Route, Body, Path, Query, Response, Tags } from "tsoa";
import {
  CreateScoringJobDTO,
  UpdateScoringJobDTO,
  ScoringJobResponseDTO,
  ScoringJobListDTO,
  ScoringJobFilterDTO,
} from "../dtos/scoring-job.dto";
import { ScoringJobService } from "../services/scoring-job.service";
import { ScoringJobStatus } from "../entities/ScoringJob";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";

@Route("/api/scoring-jobs")
@Tags("ScoringJob")
export class ScoringJobController extends Controller {
  private scoringJobService = new ScoringJobService();

  /**
   * Create a new scoring job
   */
  @Post()
  @Response(201, "Scoring job created successfully")
  async createScoringJob(@Body() dto: CreateScoringJobDTO): Promise<ScoringJobResponseDTO> {
    return await this.scoringJobService.createScoringJob(dto);
  }

  /**
   * Get scoring job by ID
   */
  @Get("{id}")
  @Response(200, "Scoring job found")
  @Response(404, "Scoring job not found")
  async getScoringJobById(@Path() id: string): Promise<ScoringJobResponseDTO> {
    return await this.scoringJobService.getScoringJobById(id);
  }

  /**
   * Get scoring job by attempt ID
   */
  @Get("attempt/{attemptId}")
  @Response(200, "Scoring job found")
  @Response(404, "Scoring job not found")
  async getScoringJobByAttemptId(@Path() attemptId: string): Promise<ScoringJobResponseDTO> {
    return await this.scoringJobService.getScoringJobByAttemptId(attemptId);
  }

  /**
   * Get all scoring jobs with pagination
   */
  @Get()
  async getAllScoringJobs(
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<ScoringJobListDTO>> {
    return await this.scoringJobService.getAllScoringJobs(limit, offset);
  }

  /**
   * Get scoring jobs by status
   */
  @Get("by-status/{status}")
  async getScoringJobsByStatus(
    @Path() status: ScoringJobStatus,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<ScoringJobListDTO>> {
    return await this.scoringJobService.getScoringJobsByStatus(status, limit, offset);
  }

  /**
   * Get pending jobs for worker processing
   */
  @Get("pending/{limit}")
  async getPendingJobs(@Path() limit: number = 10): Promise<ScoringJobResponseDTO[]> {
    return await this.scoringJobService.getPendingJobs(limit);
  }

  /**
   * Get scoring jobs with filter
   */
  @Post("filter")
  async getScoringJobsByFilter(@Body() filter: ScoringJobFilterDTO): Promise<PaginatedResponseDTO<ScoringJobListDTO>> {
    return await this.scoringJobService.getScoringJobsByFilter(filter);
  }

  /**
   * Update job status
   */
  @Put("{id}/status/{status}")
  @Response(200, "Job status updated successfully")
  @Response(404, "Job not found")
  async updateScoringJobStatus(
    @Path() id: string,
    @Path() status: ScoringJobStatus
  ): Promise<ScoringJobResponseDTO> {
    return await this.scoringJobService.updateScoringJobStatus(id, status);
  }

  /**
   * Update job with error message
   */
  @Put("{id}/error")
  @Response(200, "Job error updated successfully")
  @Response(404, "Job not found")
  async updateScoringJobError(
    @Path() id: string,
    @Body() body: { errorMessage: string }
  ): Promise<ScoringJobResponseDTO> {
    return await this.scoringJobService.updateScoringJobError(id, body.errorMessage);
  }

  /**
   * Get job count by status
   */
  @Get("stats/count/{status}")
  async getJobCountByStatus(@Path() status: ScoringJobStatus): Promise<{ count: number }> {
    const count = await this.scoringJobService.getJobCountByStatus(status);
    return { count };
  }

  /**
   * Get failed jobs count
   */
  @Get("stats/failed-count")
  async getFailedJobsCount(): Promise<{ count: number }> {
    const count = await this.scoringJobService.getFailedJobsCount();
    return { count };
  }

  /**
   * Get queued jobs count
   */
  @Get("stats/queued-count")
  async getQueuedJobsCount(): Promise<{ count: number }> {
    const count = await this.scoringJobService.getQueuedJobsCount();
    return { count };
  }

  /**
   * Delete scoring job
   */
  @Delete("{id}")
  @Response(204, "Scoring job deleted successfully")
  @Response(404, "Scoring job not found")
  async deleteScoringJob(@Path() id: string): Promise<void> {
    await this.scoringJobService.deleteScoringJob(id);
    this.setStatus(204);
  }
}

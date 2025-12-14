import { AppDataSource } from "../data-source";
import {
  CreateScoreDTO,
  UpdateScoreDTO,
  ScoreResponseDTO,
  ScoreListDTO,
  ScoreDetailDTO,
} from "../dtos/score.dto";
import { Score } from "../entities/Score";
import { Attempt, AttemptStatus } from "../entities/Attempt";
import { SkillType } from "../entities/Prompt";
import { createPaginatedResponse } from "../utils/pagination.utils";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";

export class ScoreService {
  private scoreRepository = AppDataSource.getRepository(Score);
  private attemptRepository = AppDataSource.getRepository(Attempt);

  // Create score
  async createScore(dto: CreateScoreDTO): Promise<ScoreResponseDTO> {
    // Check if attempt exists
    const attempt = await this.attemptRepository.findOne({ where: { id: dto.attemptId } });
    if (!attempt) {
      throw new Error("Attempt not found");
    }

    // Check if score already exists
    const existingScore = await this.scoreRepository.findOne({
      where: { attemptId: dto.attemptId },
    });
    if (existingScore) {
      throw new Error("Score already exists for this attempt");
    }

    // Validate overall band (0-9, step 0.5) - BR36
    this.validateBandScore(dto.overallBand);

    const score = this.scoreRepository.create({
      attemptId: dto.attemptId,
      skillType: dto.skillType,
      overallBand: dto.overallBand,
      confidence: dto.confidence,
      // Speaking sub-scores
      fluencyCoherence: dto.fluencyCoherence,
      pronunciation: dto.pronunciation,
      // Writing sub-scores
      taskAchievement: dto.taskAchievement,
      coherenceCohesion: dto.coherenceCohesion,
      // Shared sub-scores
      lexicalResource: dto.lexicalResource,
      grammaticalRange: dto.grammaticalRange,
      feedback: dto.feedback,
      detailedFeedback: dto.detailedFeedback,
    });

    const saved = await this.scoreRepository.save(score);

    // Update attempt status to SCORED
    await this.attemptRepository.update(dto.attemptId, {
      status: AttemptStatus.SCORED,
      scoredAt: new Date(),
    });

    return this.mapToResponseDTO(saved);
  }

  // Get score by ID
  async getScoreById(id: string): Promise<ScoreDetailDTO> {
    const score = await this.scoreRepository.findOne({
      where: { id },
      relations: ["attempt", "attempt.prompt"],
    });
    if (!score) {
      throw new Error("Score not found");
    }
    return this.mapToDetailDTO(score);
  }

  // Get score by attempt ID
  async getScoreByAttemptId(attemptId: string): Promise<ScoreResponseDTO> {
    const score = await this.scoreRepository.findOne({ where: { attemptId } });
    if (!score) {
      throw new Error("Score not found");
    }
    return this.mapToResponseDTO(score);
  }

  // Get all scores
  async getAllScores(limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<ScoreListDTO>> {
    const [scores, total] = await this.scoreRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });
    return createPaginatedResponse(
      scores.map((s) => this.mapToListDTO(s)),
      total,
      limit,
      offset
    );
  }

  // Get scores by band
  async getScoresByBand(band: number, limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<ScoreListDTO>> {
    this.validateBandScore(band);

    const [scores, total] = await this.scoreRepository.findAndCount({
      where: { overallBand: band },
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      scores.map((s) => this.mapToListDTO(s)),
      total,
      limit,
      offset
    );
  }

  // Get scores by band range
  async getScoresByBandRange(minBand: number, maxBand: number, limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<ScoreListDTO>> {
    if (minBand < 0 || maxBand > 9 || minBand > maxBand) {
      throw new Error("Invalid band range (0-9)");
    }

    const [scores, total] = await this.scoreRepository
      .createQueryBuilder("score")
      .where("score.overallBand >= :minBand AND score.overallBand <= :maxBand", { minBand, maxBand })
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return createPaginatedResponse(
      scores.map((s) => this.mapToListDTO(s)),
      total,
      limit,
      offset
    );
  }

  // Get scores by skill type
  async getScoresBySkillType(skillType: SkillType, limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<ScoreListDTO>> {
    const [scores, total] = await this.scoreRepository.findAndCount({
      where: { skillType },
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });
    return createPaginatedResponse(
      scores.map((s) => this.mapToListDTO(s)),
      total,
      limit,
      offset
    );
  }

  // Update score
  async updateScore(id: string, dto: UpdateScoreDTO): Promise<ScoreResponseDTO> {
    const score = await this.scoreRepository.findOne({ where: { id } });
    if (!score) {
      throw new Error("Score not found");
    }

    // Validate overall band if provided (BR36: 0-9, step 0.5)
    if (dto.overallBand !== undefined) {
      this.validateBandScore(dto.overallBand);
    }

    await this.scoreRepository.update(id, dto);
    const updated = await this.scoreRepository.findOne({ where: { id } });
    if (!updated) {
      throw new Error("Failed to update score");
    }

    return this.mapToResponseDTO(updated);
  }

  // Delete score
  async deleteScore(id: string): Promise<boolean> {
    const score = await this.scoreRepository.findOne({ where: { id } });
    if (!score) {
      throw new Error("Score not found");
    }

    // Reset attempt status
    await this.attemptRepository.update(score.attemptId, {
      status: AttemptStatus.SUBMITTED,
      scoredAt: undefined,
    });

    const result = await this.scoreRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // Get statistics
  async getAverageBand(userId?: string): Promise<{
    averageBand: number | null;
    totalScores: number;
    bySkillType: {
      speaking?: number;
      writing?: number;
    };
  }> {
    // First, check if we have any scores at all
    await this.scoreRepository.count();
    
    // Build query for overall average and count
    let overallQuery = this.scoreRepository
      .createQueryBuilder("score")
      .leftJoin("score.attempt", "attempt")
      .select("AVG(score.overallBand)", "average")
      .addSelect("COUNT(*)", "total");

    // Filter by userId if provided (for learners)
    if (userId) {
      overallQuery = overallQuery.where("attempt.learnerId = :userId", { userId });
    }

    const overallResult = await overallQuery.getRawOne();

    // Build query for average by skill type
    let bySkillQuery = this.scoreRepository
      .createQueryBuilder("score")
      .leftJoin("score.attempt", "attempt")
      .select("score.skillType", "skillType")
      .addSelect("AVG(score.overallBand)", "average")
      .groupBy("score.skillType");

    // Filter by userId if provided (for learners)
    if (userId) {
      bySkillQuery = bySkillQuery.where("attempt.learnerId = :userId", { userId });
    }

    const bySkillResult = await bySkillQuery.getRawMany();

    const bySkillType: { speaking?: number; writing?: number } = {};
    for (const row of bySkillResult) {
      if (row.skillType === "speaking") {
        bySkillType.speaking = parseFloat(row.average);
      } else if (row.skillType === "writing") {
        bySkillType.writing = parseFloat(row.average);
      }
    }

    const result = {
      averageBand: overallResult?.average ? parseFloat(overallResult.average) : null,
      totalScores: overallResult?.total ? parseInt(overallResult.total, 10) : 0,
      bySkillType,
    };
    
    return result;
  }

  async getScoreDistribution(): Promise<Record<number, number>> {
    const results = await this.scoreRepository
      .createQueryBuilder("score")
      .select("score.overallBand", "band")
      .addSelect("COUNT(*)", "count")
      .groupBy("score.overallBand")
      .getRawMany();

    const distribution: Record<number, number> = {};
    for (const result of results) {
      distribution[result.band] = parseInt(result.count, 10);
    }
    return distribution;
  }

  // Private helper - BR36: Score 0-9, step 0.5
  private validateBandScore(score: number): void {
    if (score < 0 || score > 9) {
      throw new Error("Band score must be between 0 and 9");
    }
    // Check step 0.5
    if ((score * 2) % 1 !== 0) {
      throw new Error("Band score must be in 0.5 increments");
    }
  }

  // Mappers
  private mapToResponseDTO(score: Score): ScoreResponseDTO {
    return {
      id: score.id,
      attemptId: score.attemptId,
      skillType: score.skillType,
      overallBand: Number(score.overallBand),
      confidence: score.confidence ? Number(score.confidence) : undefined,
      subScores: score.getSubScoresForChart(),
      feedback: score.feedback,
      detailedFeedback: score.detailedFeedback,
      createdAt: score.createdAt,
    };
  }

  private mapToListDTO(score: Score): ScoreListDTO {
    return {
      id: score.id,
      attemptId: score.attemptId,
      skillType: score.skillType,
      overallBand: Number(score.overallBand),
      createdAt: score.createdAt,
    };
  }

  private mapToDetailDTO(score: Score): ScoreDetailDTO {
    return {
      id: score.id,
      attemptId: score.attemptId,
      skillType: score.skillType,
      overallBand: Number(score.overallBand),
      confidence: score.confidence ? Number(score.confidence) : undefined,
      subScores: score.getSubScoresForChart(),
      feedback: score.feedback,
      detailedFeedback: score.detailedFeedback,
      createdAt: score.createdAt,
      attemptDate: score.attempt?.createdAt,
      promptContent: score.attempt?.prompt?.content,
      promptDifficulty: score.attempt?.prompt?.difficulty,
      chartData: score.getSubScoresForChart(),
    };
  }
}

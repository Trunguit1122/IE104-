import { Controller, Get, Post, Put, Delete, Route, Body, Path, Query, Response, Tags } from "tsoa";
import {
  CreatePromptDTO,
  UpdatePromptDTO,
  PromptResponseDTO,
  PromptListDTO,
  PromptDetailDTO,
  PromptFilterDTO,
} from "../dtos/prompt.dto";
import { PromptService } from "../services/prompt.service";
import { SkillType, DifficultyLevel } from "../entities/Prompt";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";

@Route("/api/prompts")
@Tags("Prompt")
export class PromptController extends Controller {
  private promptService = new PromptService();

  /**
   * Create a new prompt
   * @param createdBy User ID of the prompt creator (from auth context)
   */
  @Post()
  @Response(201, "Prompt created successfully")
  async createPrompt(@Body() dto: CreatePromptDTO, @Query() createdBy: string): Promise<PromptResponseDTO> {
    if (!createdBy) {
      throw new Error("Creator ID is required");
    }
    return await this.promptService.createPrompt(dto, createdBy);
  }

  /**
   * Get prompt by ID
   */
  @Get("{id}")
  @Response(200, "Prompt found")
  @Response(404, "Prompt not found")
  async getPromptById(@Path() id: string): Promise<PromptDetailDTO> {
    return await this.promptService.getPromptById(id);
  }

  /**
   * Get all prompts with pagination
   */
  @Get()
  async getAllPrompts(
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<PromptListDTO>> {
    return await this.promptService.getAllPrompts(limit, offset);
  }

  /**
   * Get prompts by skill type
   */
  @Get("by-skill/{skillType}")
  async getPromptsBySkillType(
    @Path() skillType: SkillType,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<PromptListDTO>> {
    return await this.promptService.getPromptsBySkillType(skillType, limit, offset);
  }

  /**
   * Get prompts by difficulty level
   */
  @Get("by-difficulty/{difficulty}")
  async getPromptsByDifficulty(
    @Path() difficulty: DifficultyLevel,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<PromptListDTO>> {
    return await this.promptService.getPromptsByDifficulty(difficulty, limit, offset);
  }

  /**
   * Get prompts by creator (teacher)
   */
  @Get("by-creator/{creatorId}")
  async getPromptsByCreator(
    @Path() creatorId: string,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<PromptListDTO>> {
    return await this.promptService.getPromptsByCreator(creatorId, limit, offset);
  }

  /**
   * Get prompts with filter
   */
  @Post("filter")
  async getPromptsByFilter(@Body() filter: PromptFilterDTO): Promise<PaginatedResponseDTO<PromptListDTO>> {
    return await this.promptService.getPromptsByFilter(filter);
  }

  /**
   * Search prompts by content
   */
  @Get("search/{query}")
  async searchPrompts(
    @Path() query: string,
    @Query() limit: number = 10
  ): Promise<PromptListDTO[]> {
    return await this.promptService.searchPrompts(query, limit);
  }

  /**
   * Update prompt
   */
  @Put("{id}")
  @Response(200, "Prompt updated successfully")
  @Response(404, "Prompt not found")
  async updatePrompt(@Path() id: string, @Body() dto: UpdatePromptDTO): Promise<PromptResponseDTO> {
    return await this.promptService.updatePrompt(id, dto);
  }

  /**
   * Delete prompt
   */
  @Delete("{id}")
  @Response(204, "Prompt deleted successfully")
  @Response(404, "Prompt not found")
  async deletePrompt(@Path() id: string): Promise<void> {
    await this.promptService.deletePrompt(id);
    this.setStatus(204);
  }
}

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
} from "tsoa";
import { TopicService } from "../services/topic.service";
import {
  CreateTopicDTO,
  UpdateTopicDTO,
  TopicResponseDTO,
  TopicListDTO,
} from "../dtos/topic.dto";

@Route("/api/topics")
@Tags("Topic")
export class TopicController extends Controller {
  private topicService = new TopicService();

  /**
   * Get all topics (public)
   */
  @Get()
  @Response<TopicListDTO[]>(200, "Topics retrieved")
  async getAllTopics(
    @Query() includeInactive: boolean = false
  ): Promise<TopicListDTO[]> {
    return await this.topicService.getAllTopics(includeInactive);
  }

  /**
   * Get topic by ID
   */
  @Get("{id}")
  @Response<TopicResponseDTO>(200, "Topic found")
  @Response(404, "Topic not found")
  async getTopicById(@Path() id: string): Promise<TopicResponseDTO | null> {
    const topic = await this.topicService.getTopicById(id);
    if (!topic) {
      this.setStatus(404);
    }
    return topic;
  }

  /**
   * Create a new topic (Teacher/Admin)
   */
  @Post()
  @Security("jwt", ["teacher", "admin"])
  @Response<TopicResponseDTO>(201, "Topic created")
  @Response(400, "Validation error")
  async createTopic(@Body() dto: CreateTopicDTO): Promise<TopicResponseDTO> {
    try {
      const topic = await this.topicService.createTopic(dto);
      this.setStatus(201);
      return topic;
    } catch (error: any) {
      this.setStatus(400);
      throw error;
    }
  }

  /**
   * Update a topic (Teacher/Admin)
   */
  @Put("{id}")
  @Security("jwt", ["teacher", "admin"])
  @Response<TopicResponseDTO>(200, "Topic updated")
  @Response(400, "Validation error")
  @Response(404, "Topic not found")
  async updateTopic(
    @Path() id: string,
    @Body() dto: UpdateTopicDTO
  ): Promise<TopicResponseDTO | null> {
    try {
      const topic = await this.topicService.updateTopic(id, dto);
      if (!topic) {
        this.setStatus(404);
      }
      return topic;
    } catch (error: any) {
      this.setStatus(400);
      throw error;
    }
  }

  /**
   * Delete a topic (Admin only)
   */
  @Delete("{id}")
  @Security("jwt", ["admin"])
  @Response(204, "Topic deleted")
  @Response(400, "Cannot delete - topic has prompts")
  @Response(404, "Topic not found")
  async deleteTopic(@Path() id: string): Promise<void> {
    try {
      const deleted = await this.topicService.deleteTopic(id);
      if (!deleted) {
        this.setStatus(404);
        return;
      }
      this.setStatus(204);
    } catch (error: any) {
      this.setStatus(400);
      throw error;
    }
  }
}


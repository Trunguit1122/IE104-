import { AppDataSource } from "../data-source";
import { Topic } from "../entities/Topic";
import {
  CreateTopicDTO,
  UpdateTopicDTO,
  TopicResponseDTO,
  TopicListDTO,
} from "../dtos/topic.dto";

export class TopicService {
  private topicRepository = AppDataSource.getRepository(Topic);

  async createTopic(dto: CreateTopicDTO): Promise<TopicResponseDTO> {
    // Check if topic name already exists
    const existing = await this.topicRepository.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new Error("Topic with this name already exists");
    }

    const topic = this.topicRepository.create({
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      sortOrder: dto.sortOrder || 0,
      isActive: true,
    });

    const saved = await this.topicRepository.save(topic);
    return this.mapToResponseDTO(saved);
  }

  async getTopicById(id: string): Promise<TopicResponseDTO | null> {
    const topic = await this.topicRepository.findOne({
      where: { id },
      relations: ["prompts"],
    });

    if (!topic) {
      return null;
    }

    return {
      ...this.mapToResponseDTO(topic),
      promptCount: topic.prompts?.length || 0,
    };
  }

  async getAllTopics(includeInactive: boolean = false): Promise<TopicListDTO[]> {
    const queryBuilder = this.topicRepository
      .createQueryBuilder("topic")
      .leftJoin("topic.prompts", "prompt", "prompt.isActive = :promptActive", {
        promptActive: true,
      })
      .addSelect("COUNT(prompt.id)", "promptCount")
      .groupBy("topic.id")
      .orderBy("topic.sortOrder", "ASC")
      .addOrderBy("topic.name", "ASC");

    if (!includeInactive) {
      queryBuilder.where("topic.isActive = :isActive", { isActive: true });
    }

    const result = await queryBuilder.getRawAndEntities();

    return result.entities.map((topic, index) => ({
      id: topic.id,
      name: topic.name,
      icon: topic.icon,
      isActive: topic.isActive,
      promptCount: parseInt(result.raw[index]?.promptCount) || 0,
    }));
  }

  async updateTopic(id: string, dto: UpdateTopicDTO): Promise<TopicResponseDTO | null> {
    const topic = await this.topicRepository.findOne({ where: { id } });

    if (!topic) {
      return null;
    }

    // Check name uniqueness if name is being changed
    if (dto.name && dto.name !== topic.name) {
      const existing = await this.topicRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new Error("Topic with this name already exists");
      }
    }

    await this.topicRepository.update(id, dto);
    const updated = await this.topicRepository.findOne({ where: { id } });

    return this.mapToResponseDTO(updated!);
  }

  async deleteTopic(id: string): Promise<boolean> {
    const topic = await this.topicRepository.findOne({
      where: { id },
      relations: ["prompts"],
    });

    if (!topic) {
      return false;
    }

    // Don't delete if topic has prompts
    if (topic.prompts && topic.prompts.length > 0) {
      throw new Error("Cannot delete topic with existing prompts. Deactivate it instead.");
    }

    await this.topicRepository.delete(id);
    return true;
  }

  private mapToResponseDTO(topic: Topic): TopicResponseDTO {
    return {
      id: topic.id,
      name: topic.name,
      description: topic.description,
      icon: topic.icon,
      isActive: topic.isActive,
      sortOrder: topic.sortOrder,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
    };
  }
}


/**
 * Topic DTOs for managing practice topics
 */

// Input DTOs
export class CreateTopicDTO {
  /**
   * Topic name (unique)
   * @maxLength 100
   */
  name!: string;

  /**
   * Topic description
   */
  description?: string;

  /**
   * Icon identifier
   */
  icon?: string;

  /**
   * Sort order for display
   */
  sortOrder?: number;
}

export class UpdateTopicDTO {
  name?: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// Output DTOs
export class TopicResponseDTO {
  id!: string;
  name!: string;
  description?: string;
  icon?: string;
  isActive!: boolean;
  sortOrder!: number;
  promptCount?: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export class TopicListDTO {
  id!: string;
  name!: string;
  icon?: string;
  isActive!: boolean;
  promptCount!: number;
}


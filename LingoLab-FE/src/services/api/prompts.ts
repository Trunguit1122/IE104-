import apiClient from "./client";
import type { Prompt, SkillType, Difficulty } from "@/types";

interface GetPromptsParams {
  page?: number;
  limit?: number;
  skillType?: SkillType;
  difficulty?: Difficulty;
  topicId?: string;
}

interface PromptsResponse {
  data: Prompt[];
  meta: {
    limit: number;
    offset: number;
    total: number;
    pages: number;
    currentPage: number;
    hasMore: boolean;
  };
}

interface CreatePromptPayload {
  skillType: 'speaking' | 'writing';
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number;
  responseTime: number;
  description?: string;
  followUpQuestions?: string;
}

export const promptsApi = {
  // GET /api/prompts - Get prompts with pagination and filters (public)
  getAll: async (params?: GetPromptsParams): Promise<PromptsResponse> => {
    const { data } = await apiClient.get<PromptsResponse>("/prompts", { params });
    return data;
  },

  // GET /api/prompts/:id - Get prompt by ID (public)
  getById: async (id: string): Promise<Prompt> => {
    const { data } = await apiClient.get<Prompt>(`/prompts/${id}`);
    return data;
  },

  // POST /api/prompts - Create prompt (Teacher/Admin)
  create: async (prompt: CreatePromptPayload): Promise<Prompt> => {
    // Get user ID from localStorage (set during login)
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const createdBy = user?.id || '';
    
    const { data } = await apiClient.post<Prompt>(`/prompts?createdBy=${createdBy}`, prompt);
    return data;
  },

  // PUT /api/prompts/:id - Update prompt (Teacher/Admin)
  update: async (id: string, prompt: Partial<Prompt>): Promise<Prompt> => {
    const { data } = await apiClient.put<Prompt>(`/prompts/${id}`, prompt);
    return data;
  },

  // DELETE /api/prompts/:id - Delete prompt (Admin)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/prompts/${id}`);
  },
};



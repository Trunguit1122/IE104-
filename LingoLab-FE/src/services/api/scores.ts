import apiClient from "./client";
import type { Score, AverageBandStats, ScoreDistribution } from "@/types";

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export const scoresApi = {
  // GET /api/scores - Get all scores
  getAll: async (): Promise<Score[]> => {
    const { data: response } = await apiClient.get<PaginatedResponse<Score>>("/scores");
    return response.data;
  },

  // GET /api/scores/:id - Get score by ID
  getById: async (id: string): Promise<Score> => {
    const { data } = await apiClient.get<Score>(`/scores/${id}`);
    return data;
  },

  // GET /api/scores/attempt/:attemptId - Get attempt scores
  getByAttemptId: async (attemptId: string): Promise<Score | Score[]> => {
    const { data } = await apiClient.get<Score | Score[]>(`/scores/attempt/${attemptId}`);
    return data;
  },

  // GET /api/scores/stats/average-band - Get average band stats
  getAverageBand: async (): Promise<AverageBandStats> => {
    const { data } = await apiClient.get<AverageBandStats>("/scores/stats/average-band");
    return data;
  },

  // GET /api/scores/stats/distribution - Get score distribution
  getDistribution: async (): Promise<ScoreDistribution[]> => {
    const { data } = await apiClient.get<ScoreDistribution[]>("/scores/stats/distribution");
    return data;
  },

  // POST /api/scores - Create score (Teacher/System)
  create: async (score: Omit<Score, 'id' | 'createdAt'>): Promise<Score> => {
    const { data } = await apiClient.post<Score>("/scores", score);
    return data;
  },

  // PUT /api/scores/:id - Update score (Teacher/Admin)
  update: async (id: string, score: Partial<Score>): Promise<Score> => {
    const { data } = await apiClient.put<Score>(`/scores/${id}`, score);
    return data;
  },

  // DELETE /api/scores/:id - Delete score (Admin)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/scores/${id}`);
  },
};



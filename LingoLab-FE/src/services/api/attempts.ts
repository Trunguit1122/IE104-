import apiClient from "./client";
import type { Attempt } from "@/types";

interface CreateAttemptPayload {
  promptId: string;
  skillType: 'speaking' | 'writing';
}

interface UpdateAttemptPayload {
  textContent?: string;
  status?: string;
}

interface AttemptsResponse {
  data: Attempt[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const attemptsApi = {
  // GET /api/attempts - Get all attempts
  getAll: async (): Promise<Attempt[]> => {
    const { data } = await apiClient.get<AttemptsResponse | Attempt[]>("/attempts");
    // Handle both paginated response and direct array
    if (Array.isArray(data)) {
      return data;
    }
    return data.data || [];
  },

  // GET /api/attempts/:id - Get attempt by ID
  getById: async (id: string): Promise<Attempt> => {
    const { data } = await apiClient.get<Attempt>(`/attempts/${id}`);
    return data;
  },

  // GET /api/attempts/learner/:learnerId - Get learner's attempts
  getByLearnerId: async (learnerId: string, limit: number = 100): Promise<Attempt[]> => {
    const { data } = await apiClient.get<AttemptsResponse | Attempt[]>(`/attempts/learner/${learnerId}?limit=${limit}`);
    // Handle both paginated response and direct array
    if (Array.isArray(data)) {
      return data;
    }
    return data.data || [];
  },

  // GET /api/attempts/learner/:learnerId/count - Count learner attempts
  getCountByLearnerId: async (learnerId: string): Promise<{ count: number }> => {
    const { data } = await apiClient.get<{ count: number }>(`/attempts/learner/${learnerId}/count`);
    return data;
  },

  // POST /api/attempts - Create attempt (Learner)
  create: async (payload: CreateAttemptPayload): Promise<Attempt> => {
    const { data } = await apiClient.post<Attempt>("/attempts", payload);
    return data;
  },

  // PUT /api/attempts/:id - Update attempt (Learner)
  update: async (id: string, payload: UpdateAttemptPayload): Promise<Attempt> => {
    const { data } = await apiClient.put<Attempt>(`/attempts/${id}`, payload);
    return data;
  },

  // PUT /api/attempts/:id/submit - Submit attempt (Learner)
  submit: async (id: string): Promise<Attempt> => {
    const { data } = await apiClient.put<Attempt>(`/attempts/${id}/submit`);
    return data;
  },

  // DELETE /api/attempts/:id - Delete attempt (Learner)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/attempts/${id}`);
  },
};



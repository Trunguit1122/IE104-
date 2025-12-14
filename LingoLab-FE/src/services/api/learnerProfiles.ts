import apiClient from "./client";
import type { LearnerProfile } from "@/types";

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface CreateLearnerProfilePayload {
  targetBand?: number;
  currentBand?: number;
  nativeLanguage?: string;
  learningGoals?: string;
}

export const learnerProfilesApi = {
  // GET /api/learner-profiles - Get all profiles
  getAll: async (): Promise<LearnerProfile[]> => {
    const { data: response } = await apiClient.get<PaginatedResponse<LearnerProfile>>("/learner-profiles");
    return response.data;
  },

  // GET /api/learner-profiles/:id - Get profile by ID
  getById: async (id: string): Promise<LearnerProfile> => {
    const { data } = await apiClient.get<LearnerProfile>(`/learner-profiles/${id}`);
    return data;
  },

  // GET /api/learner-profiles/user/:userId - Get user's profile
  getByUserId: async (userId: string): Promise<LearnerProfile> => {
    const { data } = await apiClient.get<LearnerProfile>(`/learner-profiles/user/${userId}`);
    return data;
  },

  // POST /api/learner-profiles - Create profile (Learner)
  create: async (payload: CreateLearnerProfilePayload): Promise<LearnerProfile> => {
    const { data } = await apiClient.post<LearnerProfile>("/learner-profiles", payload);
    return data;
  },

  // PUT /api/learner-profiles/:id - Update profile (Learner)
  update: async (id: string, payload: Partial<CreateLearnerProfilePayload>): Promise<LearnerProfile> => {
    const { data } = await apiClient.put<LearnerProfile>(`/learner-profiles/${id}`, payload);
    return data;
  },

  // DELETE /api/learner-profiles/:id - Delete profile (Admin)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/learner-profiles/${id}`);
  },
};



import apiClient from "./client";
import type { Feedback, FeedbackType } from "@/types";

interface CreateFeedbackPayload {
  attemptId: string;
  feedbackType: FeedbackType;
  content: string;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export const feedbackApi = {
  // GET /api/feedback - Get all feedback
  getAll: async (): Promise<Feedback[]> => {
    const { data: response } = await apiClient.get<PaginatedResponse<Feedback>>("/feedback");
    return response.data;
  },

  // GET /api/feedback/:id - Get feedback by ID
  getById: async (id: string): Promise<Feedback> => {
    const { data } = await apiClient.get<Feedback>(`/feedback/${id}`);
    return data;
  },

  // GET /api/feedback/attempt/:attemptId - Get attempt feedback
  getByAttemptId: async (attemptId: string): Promise<Feedback[]> => {
    const { data } = await apiClient.get<Feedback[]>(`/feedback/attempt/${attemptId}`);
    return data;
  },

  // POST /api/feedback - Create feedback (Teacher)
  create: async (payload: CreateFeedbackPayload): Promise<Feedback> => {
    const { data } = await apiClient.post<Feedback>("/feedback", payload);
    return data;
  },

  // PUT /api/feedback/:id - Update feedback (Teacher)
  update: async (id: string, feedback: Partial<Feedback>): Promise<Feedback> => {
    const { data } = await apiClient.put<Feedback>(`/feedback/${id}`, feedback);
    return data;
  },

  // DELETE /api/feedback/:id - Delete feedback (Teacher/Admin)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/feedback/${id}`);
  },
};



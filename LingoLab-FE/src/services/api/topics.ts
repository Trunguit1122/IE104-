import apiClient from "./client";
import type { Topic } from "@/types";

export const topicsApi = {
  // GET /api/topics - Get all topics (public)
  getAll: async (): Promise<Topic[]> => {
    const { data } = await apiClient.get<Topic[]>("/topics");
    return data;
  },

  // GET /api/topics/:id - Get topic by ID (public)
  getById: async (id: string): Promise<Topic> => {
    const { data } = await apiClient.get<Topic>(`/topics/${id}`);
    return data;
  },

  // POST /api/topics - Create topic (Teacher/Admin)
  create: async (topic: Omit<Topic, 'id' | 'createdAt'>): Promise<Topic> => {
    const { data } = await apiClient.post<Topic>("/topics", topic);
    return data;
  },

  // PUT /api/topics/:id - Update topic (Teacher/Admin)
  update: async (id: string, topic: Partial<Topic>): Promise<Topic> => {
    const { data } = await apiClient.put<Topic>(`/topics/${id}`, topic);
    return data;
  },

  // DELETE /api/topics/:id - Delete topic (Admin)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/topics/${id}`);
  },
};



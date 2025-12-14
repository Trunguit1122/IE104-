import apiClient from "./client";

type MediaType = 'audio' | 'video';

interface AttemptMedia {
  id: string;
  attemptId: string;
  mediaType: MediaType;
  storageUrl: string;
  fileName: string;
  duration?: number;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
}

interface CreateAttemptMediaPayload {
  attemptId: string;
  mediaType: MediaType;
  storageUrl: string;
  fileName: string;
  duration?: number;
  fileSize?: number;
  mimeType?: string;
}

export const attemptMediaApi = {
  // POST /api/attempt-media - Upload media (Learner)
  create: async (payload: CreateAttemptMediaPayload): Promise<AttemptMedia> => {
    const { data } = await apiClient.post<AttemptMedia>("/attempt-media", payload);
    return data;
  },

  // GET /api/attempt-media/:id - Get media by ID
  getById: async (id: string): Promise<AttemptMedia> => {
    const { data } = await apiClient.get<AttemptMedia>(`/attempt-media/${id}`);
    return data;
  },

  // GET /api/attempt-media/attempt/:attemptId - Get attempt media
  getByAttemptId: async (attemptId: string): Promise<AttemptMedia[]> => {
    const { data } = await apiClient.get<AttemptMedia[]>(`/attempt-media/attempt/${attemptId}`);
    return data;
  },

  // DELETE /api/attempt-media/:id - Delete media (Learner/Admin)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/attempt-media/${id}`);
  },
};



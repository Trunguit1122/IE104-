import apiClient from "./client";

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface ScoringJob {
  id: string;
  attemptId: string;
  status: JobStatus;
  priority: number;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface CreateJobPayload {
  attemptId: string;
  priority?: number;
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

export const scoringJobsApi = {
  // GET /api/scoring-jobs - Get all jobs (Admin)
  getAll: async (): Promise<ScoringJob[]> => {
    const { data: response } = await apiClient.get<PaginatedResponse<ScoringJob>>("/scoring-jobs");
    return response.data;
  },

  // GET /api/scoring-jobs/:id - Get job by ID (Admin)
  getById: async (id: string): Promise<ScoringJob> => {
    const { data } = await apiClient.get<ScoringJob>(`/scoring-jobs/${id}`);
    return data;
  },

  // GET /api/scoring-jobs/attempt/:attemptId - Get attempt job
  getByAttemptId: async (attemptId: string): Promise<ScoringJob> => {
    const { data } = await apiClient.get<ScoringJob>(`/scoring-jobs/attempt/${attemptId}`);
    return data;
  },

  // POST /api/scoring-jobs - Create job (System)
  create: async (payload: CreateJobPayload): Promise<ScoringJob> => {
    const { data } = await apiClient.post<ScoringJob>("/scoring-jobs", payload);
    return data;
  },

  // PUT /api/scoring-jobs/:id/status/:status - Update job status (System)
  updateStatus: async (id: string, status: JobStatus): Promise<ScoringJob> => {
    const { data } = await apiClient.put<ScoringJob>(`/scoring-jobs/${id}/status/${status}`);
    return data;
  },

  // PATCH /api/scoring-jobs/:id/retry - Retry failed job (Admin)
  retry: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.patch(`/scoring-jobs/${id}/retry`);
    return data;
  },

  // DELETE /api/scoring-jobs/:id - Delete job (Admin)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/scoring-jobs/${id}`);
  },
};



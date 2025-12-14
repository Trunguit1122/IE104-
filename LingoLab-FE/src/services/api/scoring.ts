import apiClient from "./client";

interface SubScore {
  label: string;
  value: number;
}

interface DetailedFeedback {
  strengths: string[];
  areasForImprovement: string[];
  suggestions: string[];
}

interface ScoringResultResponse {
  success: boolean;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'submitted';
  score?: {
    skillType: 'speaking' | 'writing';
    overallBand: number;
    confidence?: number;
    subScores: SubScore[];
    feedback: string;
    detailedFeedback?: DetailedFeedback;
    createdAt: string;
  };
  message?: string;
}

export const scoringApi = {
  // GET /api/scoring/result/:attemptId - Get AI scoring result (Learner/Teacher)
  getResult: async (attemptId: string): Promise<ScoringResultResponse> => {
    const { data } = await apiClient.get<ScoringResultResponse>(`/scoring/result/${attemptId}`);
    return data;
  },

  // POST /api/scoring/rescore/:attemptId - Request re-scoring for failed attempt
  requestRescore: async (attemptId: string): Promise<{ success: boolean; message: string; jobId?: string }> => {
    const { data } = await apiClient.post(`/scoring/rescore/${attemptId}`);
    return data;
  },

  // POST /api/scoring/process-jobs - Process pending scoring jobs (Admin only)
  processJobs: async (): Promise<{ processed: number; successful: number; failed: number }> => {
    const { data } = await apiClient.post("/scoring/process-jobs");
    return data;
  },
};



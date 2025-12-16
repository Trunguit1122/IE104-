import apiClient from "./client";
import type { Prompt, Attempt, SkillType, Difficulty } from "@/types";

interface PaginatedItemsResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface GetPracticePromptsParams {
  skillType?: SkillType;
  difficulty?: Difficulty;
  topicId?: string;
  page?: number;
  limit?: number;
}

interface StartPracticeResponse {
  success: boolean;
  attemptId: string;
  promptId: string;
  promptContent: string;
  skillType: 'speaking' | 'writing';
  prepTime: number;
  responseTime: number;
  startedAt: string;
  message?: string;
}

interface SubmitAttemptResponse {
  success: boolean;
  message?: string;
  attemptId: string;
  status: string;
  scoringJobId?: string;
  estimatedWaitTime?: number;
}

interface ActiveSessionResponse {
  success: boolean;
  attemptId: string;
  promptId: string;
  skillType: 'speaking' | 'writing';
  startedAt: string;
  minWordCount?: number;
  textContent?: string;
}

export const practiceApi = {
  // GET /api/practice/prompts - Get practice prompts (Learner)
  getPrompts: async (params?: GetPracticePromptsParams): Promise<{ data: Prompt[]; meta: any }> => {
    const { data } = await apiClient.get("/practice/prompts", { params });
    return data;
  },

  // GET /api/practice/history - Get practice history (Learner)
  getHistory: async (): Promise<Attempt[]> => {
    const { data: response } = await apiClient.get<PaginatedItemsResponse<Attempt>>("/practice/history");
    return response.items;
  },

  // POST /api/practice/speaking/start - Start speaking practice (Learner)
  startSpeaking: async (promptId: string): Promise<StartPracticeResponse> => {
    const { data } = await apiClient.post<StartPracticeResponse>("/practice/speaking/start", { promptId });
    return data;
  },

  // GET /api/practice/speaking/:attemptId/recordings - Get recordings for an attempt
  getAttemptRecordings: async (attemptId: string): Promise<{ id: string; fileName: string; storageUrl: string }[]> => {
    const { data } = await apiClient.get(`/practice/speaking/${attemptId}/recordings`);
    return data;
  },

  // POST /api/practice/writing/start - Start writing practice (Learner)
  startWriting: async (promptId: string): Promise<StartPracticeResponse> => {
    const { data } = await apiClient.post<StartPracticeResponse>("/practice/writing/start", { promptId });
    return data;
  },

  // GET /api/practice/writing/active - Get active writing session (Learner)
  getActiveWritingSession: async (): Promise<Attempt | null> => {
    try {
      const { data } = await apiClient.get<ActiveSessionResponse>("/practice/writing/active");
      if (!data.success || !data.attemptId) return null;
      // Convert to Attempt format
      return {
        id: data.attemptId,
        promptId: data.promptId,
        skillType: data.skillType,
        status: 'in_progress',
        startedAt: data.startedAt,
        textContent: data.textContent,
      } as Attempt;
    } catch {
      return null;
    }
  },

  // PUT /api/practice/writing/:attemptId/content - Update writing content (Learner)
  // PUT /api/practice/writing/:attemptId/content - Update writing content (Learner)
  updateWritingContent: async (attemptId: string, content: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.put(`/practice/writing/${attemptId}/content`, { content });
    return data;
  },

  // POST /api/practice/speaking/submit - Submit speaking attempt (Learner)
  submitSpeaking: async (attemptId: string, payload: { selectedRecordingId: string }): Promise<SubmitAttemptResponse> => {
    const { data } = await apiClient.post<SubmitAttemptResponse>("/practice/speaking/submit", { attemptId, selectedRecordingId: payload.selectedRecordingId });
    return data;
  },

  // POST /api/practice/writing/submit - Submit writing attempt (Learner)
  submitWriting: async (attemptId: string): Promise<SubmitAttemptResponse> => {
    const { data } = await apiClient.post<SubmitAttemptResponse>("/practice/writing/submit", { attemptId });
    return data;
  },

  // DELETE /api/practice/session/:attemptId - Delete practice session (Learner)
  deleteSession: async (attemptId: string): Promise<void> => {
    await apiClient.delete(`/practice/session/${attemptId}`);
  },

  // POST /api/practice/compare - Compare attempts (Learner)
  compareAttempts: async (attemptIds: string[]): Promise<any> => {
    const { data } = await apiClient.post("/practice/compare", { attemptIds });
    return data;
  },

  // POST /api/practice/retake - Retake practice (Learner) - UC26
  retakePractice: async (originalAttemptId: string): Promise<{ success: boolean; message?: string; newAttemptId?: string; promptId?: string }> => {
    const { data } = await apiClient.post<{ success: boolean; message?: string; newAttemptId?: string; promptId?: string }>("/practice/retake", { originalAttemptId });
    return data;
  },
};



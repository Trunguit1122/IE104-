import apiClient from "./client";
import type { Class, User, Attempt } from "@/types";

interface CreateClassPayload {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

interface EvaluateAttemptPayload {
  overallBand: number;
  taskAchievement?: number;
  coherenceCohesion?: number;
  lexicalResource?: number;
  grammaticalRange?: number;
  fluencyCoherence?: number;
  pronunciation?: number;
  feedback?: string;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
}

export interface LearnerProgress {
  learnerId: string;
  totalAttempts: number;
  completedAttempts: number;
  averageBand: number;
  // Backward compat
  overallAverage?: number;
  writingAverage?: number;
  speakingAverage?: number;
  bySkillType: {
    speaking?: { count: number; averageBand: number };
    writing?: { count: number; averageBand: number };
  };
}

interface LearnerListResponse {
  items: User[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export const teacherApi = {
  // GET /api/teacher/classes - Get teacher's classes
  getClasses: async (): Promise<Class[]> => {
    const { data } = await apiClient.get<Class[]>("/teacher/classes");
    return data;
  },

  // POST /api/teacher/classes - Create new class
  createClass: async (payload: CreateClassPayload): Promise<Class> => {
    const { data } = await apiClient.post<Class>("/teacher/classes", payload);
    return data;
  },

  // GET /api/teacher/learners - Get all learners in teacher's classes
  getLearners: async (): Promise<User[]> => {
    const { data } = await apiClient.get<LearnerListResponse>("/teacher/learners");
    // Backend returns { items: [...], total, limit, offset, hasMore }
    return data.items || [];
  },

  // GET /api/teacher/learners/:learnerId - Get learner details
  getLearnerById: async (learnerId: string): Promise<User> => {
    const { data } = await apiClient.get<User>(`/teacher/learners/${learnerId}`);
    return data;
  },

  // GET /api/teacher/learners/:learnerId/history - Get learner practice history
  getLearnerHistory: async (learnerId: string): Promise<Attempt[]> => {
    const { data } = await apiClient.get<{ success: boolean; items: Attempt[] } | Attempt[]>(`/teacher/learners/${learnerId}/history`);
    if (Array.isArray(data)) {
      return data;
    }
    return data.items || [];
  },

  // GET /api/teacher/learners/:learnerId/progress - Get learner progress
  getLearnerProgress: async (learnerId: string): Promise<LearnerProgress> => {
    const { data } = await apiClient.get<LearnerProgress & { success?: boolean }>(`/teacher/learners/${learnerId}/progress`);
    return {
      learnerId: data.learnerId,
      totalAttempts: data.totalAttempts,
      completedAttempts: data.completedAttempts || 0,
      averageBand: data.averageBand || 0,
      bySkillType: data.bySkillType || {},
    };
  },

  // GET /api/teacher/attempts/:attemptId - Get attempt details
  getAttemptById: async (attemptId: string): Promise<Attempt> => {
    const { data } = await apiClient.get<Attempt>(`/teacher/attempts/${attemptId}`);
    return data;
  },

  // POST /api/teacher/attempts/:attemptId/evaluate - Evaluate attempt
  evaluateAttempt: async (attemptId: string, payload: EvaluateAttemptPayload): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post(`/teacher/attempts/${attemptId}/evaluate`, payload);
    return data;
  },

  // POST /api/teacher/learners/:learnerId/export - Export learner report
  exportLearnerReport: async (learnerId: string): Promise<Blob> => {
    const { data } = await apiClient.post(`/teacher/learners/${learnerId}/export`, {}, {
      responseType: 'blob',
    });
    return data;
  },

  // POST /api/teacher/classes/:classId/learners - Add learners to class
  addLearnersToClass: async (classId: string, learnerIds: string[]): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post(`/teacher/classes/${classId}/learners`, { learnerIds });
    return data;
  },
};



import apiClient from "./client";
import type { Class, User } from "@/types";

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface CreateClassPayload {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

interface EnrollByCodePayload {
  classCode: string;
}

export const classesApi = {
  // GET /api/classes - Get all classes (Admin)
  getAll: async (): Promise<Class[]> => {
    const { data: response } = await apiClient.get<PaginatedResponse<Class>>("/classes");
    return response.data;
  },

  // GET /api/classes/:id - Get class by ID
  getById: async (id: string): Promise<Class> => {
    const { data } = await apiClient.get<Class>(`/classes/${id}`);
    return data;
  },

  // POST /api/classes - Create class (Teacher)
  create: async (payload: CreateClassPayload): Promise<Class> => {
    const { data } = await apiClient.post<Class>("/classes", payload);
    return data;
  },

  // PUT /api/classes/:id - Update class (Teacher)
  update: async (id: string, payload: Partial<CreateClassPayload>): Promise<Class> => {
    const { data } = await apiClient.put<Class>(`/classes/${id}`, payload);
    return data;
  },

  // DELETE /api/classes/:id - Delete class (Teacher/Admin)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/classes/${id}`);
  },

  // POST /api/classes/:id/enroll - Enroll in class (Learner)
  enroll: async (classId: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post(`/classes/${classId}/enroll`);
    return data;
  },

  // POST /api/classes/enroll-by-code/:learnerId - Enroll by code (Learner)
  enrollByCode: async (learnerId: string, payload: EnrollByCodePayload): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post(`/classes/enroll-by-code/${learnerId}`, payload);
    return data;
  },

  // POST /api/classes/:id/remove-learner - Remove learner from class (Teacher)
  removeLearner: async (classId: string, learnerId: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post(`/classes/${classId}/remove-learner`, { learnerId });
    return data;
  },

  // Get class learners
  getLearners: async (classId: string): Promise<User[]> => {
    const classData = await classesApi.getById(classId);
    return classData.learners || [];
  },
};



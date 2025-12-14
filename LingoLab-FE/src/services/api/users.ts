import apiClient from "./client";
import type { User } from "@/types";

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export const usersApi = {
  // GET /api/users - Get all users (Admin)
  getAll: async (): Promise<User[]> => {
    const { data: response } = await apiClient.get<PaginatedResponse<User>>("/users");
    return response.data;
  },

  // GET /api/users/:id - Get user by ID (Admin)
  getById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },

  // GET /api/users/role/learners - Get all learners (Admin)
  getLearners: async (): Promise<User[]> => {
    const { data: response } = await apiClient.get<PaginatedResponse<User>>("/users/role/learners");
    return response.data;
  },

  // GET /api/users/role/teachers - Get all teachers (Admin)
  getTeachers: async (): Promise<User[]> => {
    const { data: response } = await apiClient.get<PaginatedResponse<User>>("/users/role/teachers");
    return response.data;
  },

  // GET /api/users/by-email/:email - Get user by email (Admin)
  getByEmail: async (email: string): Promise<User> => {
    const { data } = await apiClient.get<User>(`/users/by-email/${encodeURIComponent(email)}`);
    return data;
  },

  // PUT /api/users/:id - Update user (Admin)
  update: async (id: string, user: Partial<User>): Promise<User> => {
    const { data } = await apiClient.put<User>(`/users/${id}`, user);
    return data;
  },

  // DELETE /api/users/:id - Delete user (Admin)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  // PUT /api/users/:id/lock - Lock user account (Admin)
  lock: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.put(`/users/${id}/lock`);
    return data;
  },

  // PUT /api/users/:id/unlock - Unlock user account (Admin)
  unlock: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.put(`/users/${id}/unlock`);
    return data;
  },
};



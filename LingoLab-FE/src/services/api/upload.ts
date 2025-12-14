import apiClient from "./client";

interface UploadResponse {
  success: boolean;
  message: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export const uploadApi = {
  // POST /api/upload/avatar - Upload avatar
  uploadAvatar: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const { data } = await apiClient.post<UploadResponse>("/upload/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  // POST /api/upload/recording/:attemptId - Upload audio recording (Learner)
  uploadRecording: async (attemptId: string, file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const { data } = await apiClient.post<UploadResponse>(`/upload/recording/${attemptId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  // Legacy method - use uploadRecording instead
  uploadAudio: async (file: File, attemptId?: string): Promise<UploadResponse> => {
    if (attemptId) {
      return uploadApi.uploadRecording(attemptId, file);
    }
    // Fallback - should not be used
    const formData = new FormData();
    formData.append("file", file);
    
    const { data } = await apiClient.post<UploadResponse>("/upload/audio", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  // POST /api/upload/video - Upload video (Learner)
  uploadVideo: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const { data } = await apiClient.post<UploadResponse>("/upload/video", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  // POST /api/upload/document - Upload document
  uploadDocument: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const { data } = await apiClient.post<UploadResponse>("/upload/document", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },
};



import apiClient from "./client";
import type { 
  User, 
  LoginCredentials, 
  RegisterCredentials,
  SignInResponse,
  SignUpResponse,
  AuthUserDTO
} from "@/types";

interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// Convert backend AuthUserDTO to frontend User format
function mapAuthUserToUser(authUser: AuthUserDTO): User {
  return {
    id: authUser.id,
    email: authUser.email,
    displayName: authUser.displayName,
    avatarUrl: authUser.avatarUrl,
    role: authUser.role,
    uiLanguage: authUser.uiLanguage,
    // For backward compatibility
    name: authUser.displayName || authUser.email.split('@')[0],
    username: authUser.email.split('@')[0],
  };
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<SignInResponse>(
      "/auth/signin",
      {
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe,
      }
    );

    if (!data.success || !data.accessToken || !data.user) {
      throw new Error(data.message || "Đăng nhập thất bại");
    }

    return {
      user: mapAuthUserToUser(data.user),
      token: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  register: async (credentials: RegisterCredentials): Promise<SignUpResponse> => {
    const { data } = await apiClient.post<SignUpResponse>(
      "/auth/signup",
      {
        email: credentials.email,
        password: credentials.password,
        displayName: credentials.displayName,
        uiLanguage: credentials.uiLanguage || "vi",
      }
    );

    if (!data.success) {
      throw new Error(data.message || "Đăng ký thất bại");
    }

    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore logout errors, still clear local state
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await apiClient.get<AuthUserDTO>("/auth/me");
    return mapAuthUserToUser(data);
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    const { data } = await apiClient.post<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>("/auth/refresh-token", { refreshToken });
    
    return {
      token: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post("/auth/forgot-password", { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post("/auth/reset-password", { token, newPassword });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post("/auth/change-password", { currentPassword, newPassword });
  },

  verifyEmail: async (token: string): Promise<void> => {
    await apiClient.post("/auth/verify-email", { token });
  },

  resendVerification: async (email: string): Promise<void> => {
    await apiClient.post("/auth/resend-verification", { email });
  },
};

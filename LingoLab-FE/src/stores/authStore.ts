import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  User,
  UserRole,
  LoginCredentials,
  RegisterCredentials,
} from "@/types";
import { STORAGE_KEYS } from "@/constants";
import { authApi } from "@/services/api/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean; // Track if store has been hydrated from localStorage
  isValidatingToken: boolean; // Track if we're validating token on startup
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (isLoading: boolean) => void;
  clearError: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  fetchCurrentUser: () => Promise<void>;
  clearAuthState: () => void; // Explicit clear for 401 handling
  setHydrated: () => void; // Called when hydration completes
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false, // Start as false, set to true after hydration
      isValidatingToken: true, // Start as true to prevent premature redirects
      error: null,

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken || null,
            isAuthenticated: true,
            isLoading: false,
            isValidatingToken: false, // Login successful, no need to validate
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Đăng nhập thất bại",
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.register(credentials);
          set({ isLoading: false });
          // After successful registration, user needs to verify email
          // So we don't auto-login here
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Đăng ký thất bại",
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignore logout API errors
        }
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      clearError: () => {
        set({ error: null });
      },

      hasRole: (role: UserRole | UserRole[]) => {
        const { user } = get();
        if (!user) return false;
        if (Array.isArray(role)) {
          return role.includes(user.role);
        }
        return user.role === role;
      },

      fetchCurrentUser: async () => {
        const { token } = get();
        if (!token) {
          set({ isValidatingToken: false });
          return;
        }

        set({ isValidatingToken: true });
        try {
          const user = await authApi.getCurrentUser();
          set({ user, isValidatingToken: false });
        } catch {
          // Token is invalid, clear auth state completely
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isValidatingToken: false,
          });
        }
      },

      clearAuthState: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          isValidatingToken: false,
          error: null,
        });
      },

      setHydrated: () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: STORAGE_KEYS.TOKEN,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // Handle rehydration from localStorage
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          // Hydration failed, clear everything
          console.error('Failed to hydrate auth state:', error);
          state?.clearAuthState();
          return;
        }
        
        // Mark as hydrated first
        state?.setHydrated();
        
        if (state?.token && state?.isAuthenticated) {
          // Validate token by fetching current user
          // isValidatingToken is already true from initial state
          state.fetchCurrentUser();
        } else {
          // No token or not authenticated, stop validating
          if (state) {
            // Use setTimeout to avoid state update during render
            setTimeout(() => {
              useAuthStore.setState({ isValidatingToken: false });
            }, 0);
          }
        }
      },
    }
  )
);

// Selector hooks for better performance
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useUserRole = () => useAuthStore((state) => state.user?.role);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
// Check if store is ready (hydrated and not validating)
export const useAuthReady = () => 
  useAuthStore((state) => state.isHydrated && !state.isValidatingToken);

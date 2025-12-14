import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '@/constants';

// Endpoints that should NOT trigger auth state clear on 401
// These are auth endpoints where 401 is expected behavior (wrong password, etc.)
const AUTH_ENDPOINTS = [
  '/auth/signin', 
  '/auth/signup', 
  '/auth/refresh-token', 
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
];

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're already handling a 401 to prevent multiple redirects
let isHandling401 = false;

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (zustand persisted state)
    const persistedState = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (persistedState) {
      try {
        const { state } = JSON.parse(persistedState);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const requestUrl = error.config?.url || '';
    
    // Check if this is an auth endpoint (login, register, etc.)
    const isAuthEndpoint = AUTH_ENDPOINTS.some(endpoint => 
      requestUrl.includes(endpoint)
    );
    
    // Check if currently on auth pages
    const isOnAuthPage = typeof window !== 'undefined' && (
      window.location.pathname === '/signin' || 
      window.location.pathname === '/signup' ||
      window.location.pathname === '/forgot-password'
    );

    // For 401 errors on non-auth endpoints (except /auth/me which is for validation)
    // Clear the stored token and redirect to signin
    if (error.response?.status === 401 && !isAuthEndpoint && !isOnAuthPage && !isHandling401) {
      console.error('🚨 401 Unauthorized detected for URL:', requestUrl);
      console.error('🚨 Response data:', error.response?.data);
      
      // Special case: /auth/me is used for token validation
      // Don't redirect, let the authStore handle it
      if (requestUrl.includes('/auth/me')) {
        // Just reject, authStore.fetchCurrentUser will handle clearing state
        const message =
          (error.response?.data as { message?: string })?.message ||
          error.message ||
          'Session expired';
        return Promise.reject(new Error(message));
      }
      
      console.error('🚨 Clearing auth state and redirecting to /signin...');
      isHandling401 = true;
      
      // Clear the persisted auth state
      try {
        const persistedState = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (persistedState) {
          const parsed = JSON.parse(persistedState);
          parsed.state = {
            ...parsed.state,
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isValidatingToken: false,
          };
          localStorage.setItem(STORAGE_KEYS.TOKEN, JSON.stringify(parsed));
        }
      } catch {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
      }
      
      // Redirect to signin
      setTimeout(() => {
        isHandling401 = false;
        if (typeof window !== 'undefined') {
          window.location.href = '/signin';
        }
      }, 100);
    }

    // Extract error message from response
    const message =
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject(new Error(message));
  }
);

export default apiClient;

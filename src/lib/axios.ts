import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { encryptedStorage } from '@/lib/secure-storage';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

let refreshTokenPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

function restoreAuthStateFromStorage() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = encryptedStorage.getItem('auth-storage');
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      state?: {
        accessToken?: string | null;
        refreshToken?: string | null;
        isAuthenticated?: boolean;
        user?: unknown;
      };
    };

    const state = parsed.state;
    if (!state?.accessToken || !state.refreshToken) {
      return null;
    }

    useAuthStore.setState((current) => ({
      ...current,
      accessToken: state.accessToken ?? null,
      refreshToken: state.refreshToken ?? null,
      isAuthenticated: Boolean(state.isAuthenticated),
    }));

    return {
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
    };
  } catch {
    return null;
  }
}

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const storedState = useAuthStore.getState();
  const restored = storedState.accessToken ? null : restoreAuthStateFromStorage();
  const token = storedState.accessToken ?? restored?.accessToken ?? null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait a moment.');
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const requestUrl = String(originalRequest.url ?? '');
      if (requestUrl.includes('/auth/refresh') || requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken =
          useAuthStore.getState().refreshToken ?? restoreAuthStateFromStorage()?.refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        if (!refreshTokenPromise) {
          refreshTokenPromise = axios
            .post(
              `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/refresh`,
              { refreshToken },
            )
            .then(({ data }) => data)
            .finally(() => {
              refreshTokenPromise = null;
            });
        }

        const data = await refreshTokenPromise;

        useAuthStore.setState((state) => ({
          ...state,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        }));

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    const message = error.response?.data?.message || error.message || 'An error occurred';
    // Only show toast for non-401 errors (401 is handled above)
    if (error.response?.status !== 401) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;

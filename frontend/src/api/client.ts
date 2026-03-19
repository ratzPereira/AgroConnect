import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT interceptor — attach access token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 interceptor — auto-refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(undefined);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => apiClient(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshTokenValue = localStorage.getItem('refreshToken');

    if (!refreshTokenValue) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: refreshTokenValue,
      });

      const { accessToken, refreshToken, user } = response.data;

      useAuthStore.getState().setTokens(accessToken, refreshToken);
      useAuthStore.getState().setUser(user);

      processQueue(null);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

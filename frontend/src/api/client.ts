import axios from 'axios';
import { toast } from 'sonner';
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

// Toast notifications for API errors
function showErrorToast(status: number | undefined): void {
  const messages: Record<number, string> = {
    403: 'Sem permissão para realizar esta ação.',
    404: 'O recurso solicitado não foi encontrado.',
    409: 'Operação em conflito. Tente novamente.',
    429: 'Demasiados pedidos. Aguarde um momento.',
  };

  if (status && messages[status]) {
    toast.error(messages[status], { duration: 6000 });
  } else if (status && status >= 500) {
    toast.error('Erro no servidor. Tente novamente mais tarde.', { duration: 6000 });
  } else if (!status) {
    toast.error('Erro de ligação. Verifique a sua internet.', { duration: 6000 });
  }
}

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
    const status = error.response?.status;

    // Show toast for errors. 401 is handled by the refresh flow below.
    // 400 surfaces backend validation messages (Portuguese) when available.
    if (status === 400) {
      const backendMessage = error.response?.data?.message;
      if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
        toast.error(backendMessage, { duration: 6000 });
      }
    } else if (status !== 401) {
      showErrorToast(status);
    }

    if (
      status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/')
    ) {
      throw error;
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
      globalThis.location.href = '/login';
      throw error;
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
      globalThis.location.href = '/login';
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  },
);

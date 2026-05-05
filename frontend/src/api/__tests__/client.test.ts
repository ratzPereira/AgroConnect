import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';

// Mock sonner
vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

// Mock auth store
const mockLogout = vi.fn();
const mockSetTokens = vi.fn();
const mockSetUser = vi.fn();
vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      logout: mockLogout,
      setTokens: mockSetTokens,
      setUser: mockSetUser,
    }),
  },
}));

// We need to test interceptors. Since MSW doesn't work well in this jsdom setup
// with relative baseURLs, we capture the interceptor callbacks by spying on
// axios.create and the interceptors.request.use / interceptors.response.use calls.

// Capture interceptor callbacks
type RequestFulfilled = (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
type ResponseRejected = (error: unknown) => Promise<unknown>;

let requestInterceptor: RequestFulfilled;
let responseErrorInterceptor: ResponseRejected;

const mockRequestUse = vi.fn();
const mockResponseUse = vi.fn();

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => {
        const instance = {
          defaults: {
            baseURL: '/api/v1',
            headers: { 'Content-Type': 'application/json' },
          },
          interceptors: {
            request: {
              use: (fulfilled: RequestFulfilled) => {
                requestInterceptor = fulfilled;
                mockRequestUse(fulfilled);
              },
            },
            response: {
              use: (_fulfilled: (res: AxiosResponse) => AxiosResponse, rejected: ResponseRejected) => {
                responseErrorInterceptor = rejected;
                mockResponseUse(_fulfilled, rejected);
              },
            },
          },
          get: vi.fn(),
          post: vi.fn(),
          put: vi.fn(),
          patch: vi.fn(),
          delete: vi.fn(),
        };
        return instance;
      }),
      post: vi.fn(),
    },
  };
});

describe('apiClient', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    // Re-import to trigger interceptor registration
    vi.resetModules();
    // Re-mock before import
    vi.doMock('sonner', () => ({
      toast: { error: vi.fn() },
    }));
    vi.doMock('@/stores/authStore', () => ({
      useAuthStore: {
        getState: () => ({
          logout: mockLogout,
          setTokens: mockSetTokens,
          setUser: mockSetUser,
        }),
      },
    }));
    await import('../client');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create axios instance with /api/v1 base URL', () => {
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('should register both request and response interceptors', () => {
    expect(mockRequestUse).toHaveBeenCalledTimes(1);
    expect(mockResponseUse).toHaveBeenCalledTimes(1);
  });

  describe('request interceptor', () => {
    it('should attach Authorization header when accessToken exists', () => {
      localStorage.setItem('accessToken', 'my-jwt-token');
      const mockConfig = {
        headers: { set: vi.fn() } as unknown as AxiosHeaders,
      } as unknown as InternalAxiosRequestConfig;
      // Provide writable headers
      const headers = new Map<string, string>();
      Object.defineProperty(mockConfig, 'headers', {
        get: () => {
          const h: Record<string, unknown> = {};
          headers.forEach((v, k) => { h[k] = v; });
          h.Authorization = headers.get('Authorization');
          return h;
        },
        set: () => {},
      });
      // The real interceptor sets config.headers.Authorization
      // Let's use a plain object
      const config = { headers: {} } as unknown as InternalAxiosRequestConfig;
      const result = requestInterceptor(config);
      expect(result.headers.Authorization).toBe('Bearer my-jwt-token');
    });

    it('should not attach Authorization header when no token', () => {
      const config = { headers: {} } as unknown as InternalAxiosRequestConfig;
      const result = requestInterceptor(config);
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('response error interceptor - toast messages', () => {
    it('should show 403 forbidden toast', async () => {
      const { toast } = await import('sonner');
      const error = {
        config: { url: '/test', _retry: false },
        response: { status: 403 },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(toast.error).toHaveBeenCalledWith(
        'Sem permissão para realizar esta ação.',
        { duration: 6000 },
      );
    });

    it('should show 404 not found toast', async () => {
      const { toast } = await import('sonner');
      const error = {
        config: { url: '/test', _retry: false },
        response: { status: 404 },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(toast.error).toHaveBeenCalledWith(
        'O recurso solicitado não foi encontrado.',
        { duration: 6000 },
      );
    });

    it('should show 409 conflict toast', async () => {
      const { toast } = await import('sonner');
      const error = {
        config: { url: '/test', _retry: false },
        response: { status: 409 },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(toast.error).toHaveBeenCalledWith(
        'Operação em conflito. Tente novamente.',
        { duration: 6000 },
      );
    });

    it('should show 429 rate limit toast', async () => {
      const { toast } = await import('sonner');
      const error = {
        config: { url: '/test', _retry: false },
        response: { status: 429 },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(toast.error).toHaveBeenCalledWith(
        'Demasiados pedidos. Aguarde um momento.',
        { duration: 6000 },
      );
    });

    it('should show server error toast for 500 status', async () => {
      const { toast } = await import('sonner');
      const error = {
        config: { url: '/test', _retry: false },
        response: { status: 500 },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(toast.error).toHaveBeenCalledWith(
        'Erro no servidor. Tente novamente mais tarde.',
        { duration: 6000 },
      );
    });

    it('should show server error toast for 503 status', async () => {
      const { toast } = await import('sonner');
      const error = {
        config: { url: '/test', _retry: false },
        response: { status: 503 },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(toast.error).toHaveBeenCalledWith(
        'Erro no servidor. Tente novamente mais tarde.',
        { duration: 6000 },
      );
    });

    it('should show connection error toast when no response', async () => {
      const { toast } = await import('sonner');
      const error = {
        config: { url: '/test', _retry: false },
        response: undefined,
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(toast.error).toHaveBeenCalledWith(
        'Erro de ligação. Verifique a sua internet.',
        { duration: 6000 },
      );
    });

    it('should not show toast for 400 validation errors', async () => {
      const { toast } = await import('sonner');
      const error = {
        config: { url: '/test', _retry: false },
        response: { status: 400 },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should not show toast for 401 (handled by refresh logic)', async () => {
      const { toast } = await import('sonner');
      // 401 on an auth endpoint -- should just reject without toast
      const error = {
        config: { url: '/auth/login', _retry: false },
        response: { status: 401 },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('response error interceptor - 401 refresh logic', () => {
    it('should skip refresh for auth endpoints', async () => {
      const error = {
        config: { url: '/auth/login', _retry: false },
        response: { status: 401 },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(mockLogout).not.toHaveBeenCalled();
    });

    it('should skip refresh for already-retried requests', async () => {
      const error = {
        config: { url: '/protected', _retry: true },
        response: { status: 401 },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(mockLogout).not.toHaveBeenCalled();
    });

    it('should logout and redirect when no refreshToken available', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: '' },
      });

      const error = {
        config: { url: '/protected', headers: {} },
        response: { status: 401 },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(mockLogout).toHaveBeenCalled();
      expect(window.location.href).toBe('/login');
    });

    it('should attempt refresh when refreshToken exists', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: '' },
      });
      localStorage.setItem('refreshToken', 'old-refresh-token');

      const mockAxiosPost = vi.mocked(axios.post);
      mockAxiosPost.mockResolvedValue({
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          user: { id: 1, name: 'Test', email: 'test@test.pt', role: 'CLIENT' },
        },
      });

      const error = {
        config: { url: '/protected', headers: {} },
        response: { status: 401 },
      };

      // The interceptor will try to call apiClient(originalRequest) after refresh,
      // but apiClient is a mock so it will return undefined. The important thing
      // is that setTokens and setUser are called.
      try {
        await responseErrorInterceptor(error);
      } catch {
        // May fail on retry since apiClient is mocked
      }

      expect(mockAxiosPost).toHaveBeenCalledWith('/api/v1/auth/refresh', {
        refreshToken: 'old-refresh-token',
      });
      expect(mockSetTokens).toHaveBeenCalledWith('new-access-token', 'new-refresh-token');
      expect(mockSetUser).toHaveBeenCalledWith({
        id: 1, name: 'Test', email: 'test@test.pt', role: 'CLIENT',
      });
    });

    it('should logout and redirect when refresh fails', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: '' },
      });
      localStorage.setItem('refreshToken', 'expired-token');

      const mockAxiosPost = vi.mocked(axios.post);
      mockAxiosPost.mockRejectedValue(new Error('Refresh failed'));

      const error = {
        config: { url: '/protected', headers: {} },
        response: { status: 401 },
      };

      await expect(responseErrorInterceptor(error)).rejects.toThrow('Refresh failed');
      expect(mockLogout).toHaveBeenCalled();
      expect(window.location.href).toBe('/login');
    });
  });
});

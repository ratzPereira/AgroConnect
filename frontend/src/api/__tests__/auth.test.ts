import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import {
  login,
  register,
  refreshToken,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from '../auth';

vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login calls POST /auth/login with credentials', async () => {
    const mockData = { accessToken: 'token123', refreshToken: 'refresh456', user: { id: 1 } };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await login({ email: 'farmer@azores.pt', password: 'password123' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'farmer@azores.pt',
      password: 'password123',
    });
    expect(result).toEqual(mockData);
  });

  it('register calls POST /auth/register with registration data', async () => {
    const mockData = { message: 'Conta criada com sucesso' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const registerData = {
      name: 'Test User',
      email: 'test@test.pt',
      password: 'strongPass123',
      role: 'CLIENT' as const,
    };
    const result = await register(registerData);

    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', registerData);
    expect(result).toEqual(mockData);
  });

  it('refreshToken calls POST /auth/refresh with token', async () => {
    const mockData = { accessToken: 'newToken', refreshToken: 'newRefresh', user: { id: 1 } };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await refreshToken('oldRefreshToken');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'oldRefreshToken' });
    expect(result).toEqual(mockData);
  });

  it('logout calls POST /auth/logout', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({});

    await logout();

    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
  });

  it('verifyEmail calls GET /auth/verify-email with token param', async () => {
    const mockData = { message: 'Email verificado' };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await verifyEmail('verification-token-abc');

    expect(apiClient.get).toHaveBeenCalledWith('/auth/verify-email', {
      params: { token: 'verification-token-abc' },
    });
    expect(result).toEqual(mockData);
  });

  it('resendVerification calls POST /auth/resend-verification', async () => {
    const mockData = { message: 'Email reenviado' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await resendVerification({ email: 'test@test.pt' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/resend-verification', { email: 'test@test.pt' });
    expect(result).toEqual(mockData);
  });

  it('forgotPassword calls POST /auth/forgot-password', async () => {
    const mockData = { message: 'Email enviado' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await forgotPassword({ email: 'forgot@test.pt' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'forgot@test.pt' });
    expect(result).toEqual(mockData);
  });

  it('resetPassword calls POST /auth/reset-password', async () => {
    const mockData = { message: 'Password alterada' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const resetData = { token: 'reset-token', password: 'newPass123' };
    const result = await resetPassword(resetData);

    expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', resetData);
    expect(result).toEqual(mockData);
  });
});

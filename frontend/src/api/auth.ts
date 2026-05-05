import { apiClient } from './client';
import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
} from '@/types/auth';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', data);
  return response.data;
}

export async function register(data: RegisterRequest): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>('/auth/register', data);
  return response.data;
}

export async function refreshToken(token: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken: token });
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function verifyEmail(token: string): Promise<MessageResponse> {
  const response = await apiClient.get<MessageResponse>('/auth/verify-email', {
    params: { token },
  });
  return response.data;
}

export async function resendVerification(data: ResendVerificationRequest): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>('/auth/resend-verification', data);
  return response.data;
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>('/auth/forgot-password', data);
  return response.data;
}

export async function resetPassword(data: ResetPasswordRequest): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>('/auth/reset-password', data);
  return response.data;
}

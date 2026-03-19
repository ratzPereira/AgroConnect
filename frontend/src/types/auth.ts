export type Role = 'ADMIN' | 'CLIENT' | 'PROVIDER_MANAGER' | 'PROVIDER_LEAD' | 'PROVIDER_OPERATOR';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone?: string;
  role: 'CLIENT' | 'PROVIDER_MANAGER';
  companyName?: string;
  nif?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserResponse;
}

import { apiClient } from './client';

export interface ClientProfileData {
  id: number;
  name: string;
  phone: string | null;
  parish: string | null;
  municipality: string | null;
  island: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ProviderProfileData {
  id: number;
  companyName: string;
  nif: string | null;
  phone: string | null;
  description: string | null;
  serviceRadiusKm: number | null;
  avgRating: number | null;
  totalReviews: number | null;
  verified: boolean;
  latitude: number | null;
  longitude: number | null;
  island: string | null;
  municipality: string | null;
  parish: string | null;
  profileComplete: boolean;
}

export type ProfileData = ClientProfileData | ProviderProfileData;

export function isProviderProfile(profile: ProfileData): profile is ProviderProfileData {
  return 'companyName' in profile;
}

export interface UpdateClientProfileRequest {
  name?: string;
  phone?: string;
  parish?: string;
  municipality?: string;
  island?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateProviderProfileRequest {
  companyName?: string;
  nif?: string;
  phone?: string;
  description?: string;
  serviceRadiusKm?: number;
  latitude?: number;
  longitude?: number;
  island?: string;
  municipality?: string;
  parish?: string;
}

export async function getMyProfile(): Promise<ProfileData> {
  const response = await apiClient.get<ProfileData>('/profile/me');
  return response.data;
}

export async function updateClientProfile(data: UpdateClientProfileRequest): Promise<ClientProfileData> {
  const response = await apiClient.put<ClientProfileData>('/profile/me/client', data);
  return response.data;
}

export async function updateProviderProfile(data: UpdateProviderProfileRequest): Promise<ProviderProfileData> {
  const response = await apiClient.put<ProviderProfileData>('/profile/me/provider', data);
  return response.data;
}

import { apiClient } from './client';
import type { AdminDashboard, AdminUser, AdminDispute, AdminAnalytics } from '@/types/admin';
import type { Page } from '@/types/request';
import type { ListingSummary } from '@/types/listing';

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const response = await apiClient.get<AdminDashboard>('/admin/dashboard');
  return response.data;
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const response = await apiClient.get<AdminAnalytics>('/admin/analytics');
  return response.data;
}

export async function listUsers(role?: string, page = 0, size = 20): Promise<Page<AdminUser>> {
  const params: Record<string, string | number> = { page, size };
  if (role) params.role = role;
  const response = await apiClient.get<Page<AdminUser>>('/admin/users', { params });
  return response.data;
}

export async function getUserDetail(id: number): Promise<AdminUser> {
  const response = await apiClient.get<AdminUser>(`/admin/users/${id}`);
  return response.data;
}

export async function banUser(id: number): Promise<void> {
  await apiClient.post(`/admin/users/${id}/ban`);
}

export async function unbanUser(id: number): Promise<void> {
  await apiClient.post(`/admin/users/${id}/unban`);
}

export async function listDisputes(page = 0, size = 20): Promise<Page<AdminDispute>> {
  const response = await apiClient.get<Page<AdminDispute>>('/admin/disputes', {
    params: { page, size },
  });
  return response.data;
}

export async function listAdminListings(status?: string, page = 0, size = 20): Promise<Page<ListingSummary>> {
  const params: Record<string, string | number> = { page, size };
  if (status) params.status = status;
  const response = await apiClient.get<Page<ListingSummary>>('/admin/listings', { params });
  return response.data;
}

export async function removeAdminListing(id: number): Promise<void> {
  await apiClient.delete(`/admin/listings/${id}`);
}

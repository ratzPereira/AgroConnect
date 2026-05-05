import { apiClient } from './client';
import type { TeamMember, CreateTeamMemberRequest, UpdateTeamMemberRequest } from '@/types/teamMember';

export async function listTeamMembers(): Promise<TeamMember[]> {
  const response = await apiClient.get<TeamMember[]>('/providers/me/team');
  return response.data;
}

export async function getTeamMember(id: number): Promise<TeamMember> {
  const response = await apiClient.get<TeamMember>(`/providers/me/team/${id}`);
  return response.data;
}

export async function createTeamMember(data: CreateTeamMemberRequest): Promise<TeamMember> {
  const response = await apiClient.post<TeamMember>('/providers/me/team', data);
  return response.data;
}

export async function updateTeamMember(id: number, data: UpdateTeamMemberRequest): Promise<TeamMember> {
  const response = await apiClient.put<TeamMember>(`/providers/me/team/${id}`, data);
  return response.data;
}

export async function deactivateTeamMember(id: number): Promise<void> {
  await apiClient.delete(`/providers/me/team/${id}`);
}

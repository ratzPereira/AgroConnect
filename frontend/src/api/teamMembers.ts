import { apiClient } from './client';
import type {
  TeamMember,
  CreateTeamMemberRequest,
  UpdateTeamMemberRequest,
  OperatorAnalytics,
  OperatorJob,
} from '@/types/teamMember';
import type { Page } from '@/types/request';

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

export async function getOperatorAnalytics(
  id: number,
  from?: string,
  to?: string,
): Promise<OperatorAnalytics> {
  const response = await apiClient.get<OperatorAnalytics>(
    `/providers/me/team/${id}/details`,
    { params: { from, to } },
  );
  return response.data;
}

export async function listOperatorJobs(
  id: number,
  from?: string,
  to?: string,
  page = 0,
  size = 10,
): Promise<Page<OperatorJob>> {
  const response = await apiClient.get<Page<OperatorJob>>(
    `/providers/me/team/${id}/jobs`,
    { params: { from, to, page, size } },
  );
  return response.data;
}

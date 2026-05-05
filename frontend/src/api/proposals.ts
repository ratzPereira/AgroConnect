import { apiClient } from './client';
import type { CreateProposalDto, ProposalResponse } from '@/types/proposal';
import type { Page } from '@/types/request';

export async function createProposal(
  requestId: number,
  data: CreateProposalDto,
): Promise<ProposalResponse> {
  const response = await apiClient.post<ProposalResponse>(
    `/requests/${requestId}/proposals`,
    data,
  );
  return response.data;
}

export async function getRequestProposals(requestId: number): Promise<ProposalResponse[]> {
  const response = await apiClient.get<ProposalResponse[]>(
    `/requests/${requestId}/proposals`,
  );
  return response.data;
}

export async function getMyProposals(
  page = 0,
  size = 20,
): Promise<Page<ProposalResponse>> {
  const response = await apiClient.get<Page<ProposalResponse>>('/proposals/mine', {
    params: { page, size },
  });
  return response.data;
}

export async function acceptProposal(proposalId: number): Promise<ProposalResponse> {
  const response = await apiClient.post<ProposalResponse>(`/proposals/${proposalId}/accept`);
  return response.data;
}

export async function withdrawProposal(proposalId: number): Promise<ProposalResponse> {
  const response = await apiClient.post<ProposalResponse>(`/proposals/${proposalId}/withdraw`);
  return response.data;
}

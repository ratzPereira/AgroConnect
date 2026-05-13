import { apiClient } from './client';
import type {
  JobCosts,
  RecordResourceUsageRequest,
  ResourceUsage,
  UpdateAssignmentHoursRequest,
  AssignmentCost,
} from '@/types/jobCosting';

export async function getJobCosts(executionId: number): Promise<JobCosts> {
  const response = await apiClient.get<JobCosts>(`/executions/${executionId}/costs`);
  return response.data;
}

export async function recordResourceUsage(
  executionId: number,
  data: RecordResourceUsageRequest,
): Promise<ResourceUsage> {
  const response = await apiClient.post<ResourceUsage>(
    `/executions/${executionId}/resource-usage`,
    data,
  );
  return response.data;
}

export async function deleteResourceUsage(executionId: number, usageId: number): Promise<void> {
  await apiClient.delete(`/executions/${executionId}/resource-usage/${usageId}`);
}

export async function updateAssignmentHours(
  executionId: number,
  assignmentId: number,
  data: UpdateAssignmentHoursRequest,
): Promise<AssignmentCost> {
  const response = await apiClient.patch<AssignmentCost>(
    `/executions/${executionId}/assignments/${assignmentId}/hours`,
    data,
  );
  return response.data;
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import axios from 'axios';
import {
  getExecutionByRequest,
  assignExecution,
  checkinExecution,
  getPhotoUploadUrl,
  confirmExecutionPhoto,
  completeExecution,
} from '../executions';

vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {
    isAxiosError: vi.fn(),
  },
}));

describe('executions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getExecutionByRequest calls GET /executions/request/{id} and returns data', async () => {
    const mockData = { id: 1, requestId: 5, status: 'ASSIGNED' };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getExecutionByRequest(5);

    expect(apiClient.get).toHaveBeenCalledWith('/executions/request/5');
    expect(result).toEqual(mockData);
  });

  it('getExecutionByRequest returns null on 404', async () => {
    const error = { response: { status: 404 } };
    vi.mocked(apiClient.get).mockRejectedValue(error);
    vi.mocked(axios.isAxiosError).mockReturnValue(true);

    const result = await getExecutionByRequest(999);

    expect(result).toBeNull();
  });

  it('getExecutionByRequest rethrows non-404 errors', async () => {
    const error = { response: { status: 500 }, message: 'Server error' };
    vi.mocked(apiClient.get).mockRejectedValue(error);
    vi.mocked(axios.isAxiosError).mockReturnValue(true);

    await expect(getExecutionByRequest(999)).rejects.toEqual(error);
  });

  it('assignExecution calls POST /executions/{id}/assign', async () => {
    const mockData = { id: 1, status: 'ASSIGNED' };
    const assignData = { teamMemberId: 3, machineId: 7 };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await assignExecution(1, assignData);

    expect(apiClient.post).toHaveBeenCalledWith('/executions/1/assign', assignData);
    expect(result).toEqual(mockData);
  });

  it('checkinExecution calls POST /executions/{id}/checkin', async () => {
    const mockData = { id: 1, status: 'IN_PROGRESS' };
    const checkinData = { latitude: 38.65, longitude: -27.21 };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await checkinExecution(1, checkinData);

    expect(apiClient.post).toHaveBeenCalledWith('/executions/1/checkin', checkinData);
    expect(result).toEqual(mockData);
  });

  it('getPhotoUploadUrl calls POST /executions/{id}/photos/upload', async () => {
    const mockData = { uploadUrl: 'https://minio.local/upload', fileUrl: 'https://minio.local/file.jpg' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await getPhotoUploadUrl(1);

    expect(apiClient.post).toHaveBeenCalledWith('/executions/1/photos/upload');
    expect(result).toEqual(mockData);
  });

  it('confirmExecutionPhoto calls POST /executions/{id}/photos', async () => {
    const mockData = { id: 1, photos: [] };
    const photoData = { photoUrl: 'https://minio.local/photo.jpg', latitude: 38.65, longitude: -27.21 };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await confirmExecutionPhoto(1, photoData);

    expect(apiClient.post).toHaveBeenCalledWith('/executions/1/photos', photoData);
    expect(result).toEqual(mockData);
  });

  it('completeExecution calls POST /executions/{id}/complete', async () => {
    const mockData = { id: 1, status: 'COMPLETED' };
    const completeData = { notes: 'Trabalho concluido', materialsUsed: 'Fertilizante 50kg' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await completeExecution(1, completeData);

    expect(apiClient.post).toHaveBeenCalledWith('/executions/1/complete', completeData);
    expect(result).toEqual(mockData);
  });
});

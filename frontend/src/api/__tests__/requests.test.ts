import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import {
  createRequest,
  updateRequest,
  publishRequest,
  cancelRequest,
  getRequest,
  getMyRequests,
  getAvailableRequests,
  getUploadUrl,
  confirmPhoto,
  deletePhoto,
  confirmRequest,
  disputeRequest,
} from '../requests';

vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('requests API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createRequest calls POST /requests', async () => {
    const dto = { categoryId: 1, description: 'Lavoura', latitude: 38.65, longitude: -27.21, area: 2.0 };
    const mockResponse = { id: 1, ...dto, status: 'DRAFT' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    const result = await createRequest(dto as never);

    expect(apiClient.post).toHaveBeenCalledWith('/requests', dto);
    expect(result).toEqual(mockResponse);
  });

  it('updateRequest calls PUT /requests/{id}', async () => {
    const dto = { description: 'Updated description' };
    const mockResponse = { id: 5, description: 'Updated description' };
    vi.mocked(apiClient.put).mockResolvedValue({ data: mockResponse });

    const result = await updateRequest(5, dto as never);

    expect(apiClient.put).toHaveBeenCalledWith('/requests/5', dto);
    expect(result).toEqual(mockResponse);
  });

  it('publishRequest calls POST /requests/{id}/publish', async () => {
    const mockResponse = { id: 3, status: 'PUBLISHED' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    const result = await publishRequest(3);

    expect(apiClient.post).toHaveBeenCalledWith('/requests/3/publish');
    expect(result).toEqual(mockResponse);
  });

  it('cancelRequest calls POST /requests/{id}/cancel', async () => {
    const mockResponse = { id: 7, status: 'CANCELLED' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    const result = await cancelRequest(7);

    expect(apiClient.post).toHaveBeenCalledWith('/requests/7/cancel');
    expect(result).toEqual(mockResponse);
  });

  it('getRequest calls GET /requests/{id}', async () => {
    const mockResponse = { id: 10, description: 'Test request' };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

    const result = await getRequest(10);

    expect(apiClient.get).toHaveBeenCalledWith('/requests/10');
    expect(result).toEqual(mockResponse);
  });

  it('getMyRequests calls GET /requests/mine with page/size/status', async () => {
    const mockPage = { content: [], totalElements: 0 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await getMyRequests(0, 10, 'PUBLISHED');

    expect(apiClient.get).toHaveBeenCalledWith('/requests/mine', {
      params: { page: 0, size: 10, status: 'PUBLISHED' },
    });
    expect(result).toEqual(mockPage);
  });

  it('getMyRequests omits status param when not provided', async () => {
    const mockPage = { content: [], totalElements: 0 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    await getMyRequests(0, 20);

    expect(apiClient.get).toHaveBeenCalledWith('/requests/mine', {
      params: { page: 0, size: 20 },
    });
  });

  it('getAvailableRequests calls GET /requests/available with filters', async () => {
    const mockPage = { content: [], totalElements: 0 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await getAvailableRequests({
      page: 1,
      size: 10,
      search: 'lavoura',
      categoryId: 2,
      urgency: 'HIGH',
      island: 'Terceira',
    });

    expect(apiClient.get).toHaveBeenCalledWith('/requests/available', {
      params: {
        page: 1,
        size: 10,
        search: 'lavoura',
        categoryId: 2,
        urgency: 'HIGH',
        island: 'Terceira',
      },
    });
    expect(result).toEqual(mockPage);
  });

  it('getUploadUrl calls POST /requests/{id}/photos/upload', async () => {
    const mockResponse = { uploadUrl: 'https://minio.local/upload', fileUrl: 'https://minio.local/file.jpg' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    const result = await getUploadUrl(15);

    expect(apiClient.post).toHaveBeenCalledWith('/requests/15/photos/upload');
    expect(result).toEqual(mockResponse);
  });

  it('confirmPhoto calls POST /requests/{id}/photos with photoUrl', async () => {
    const mockResponse = { id: 15, photos: [{ url: 'https://minio.local/file.jpg' }] };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    const result = await confirmPhoto(15, 'https://minio.local/file.jpg');

    expect(apiClient.post).toHaveBeenCalledWith('/requests/15/photos', {
      photoUrl: 'https://minio.local/file.jpg',
    });
    expect(result).toEqual(mockResponse);
  });

  it('deletePhoto calls DELETE /requests/{id}/photos/{photoId}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({});

    await deletePhoto(15, 3);

    expect(apiClient.delete).toHaveBeenCalledWith('/requests/15/photos/3');
  });

  it('confirmRequest calls POST /requests/{id}/confirm', async () => {
    const mockResponse = { id: 20, status: 'COMPLETED' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    const result = await confirmRequest(20);

    expect(apiClient.post).toHaveBeenCalledWith('/requests/20/confirm');
    expect(result).toEqual(mockResponse);
  });

  it('disputeRequest calls POST /requests/{id}/dispute with reason', async () => {
    const mockResponse = { id: 20, status: 'DISPUTED' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    const result = await disputeRequest(20, { reason: 'Trabalho incompleto' });

    expect(apiClient.post).toHaveBeenCalledWith('/requests/20/dispute', { reason: 'Trabalho incompleto' });
    expect(result).toEqual(mockResponse);
  });
});

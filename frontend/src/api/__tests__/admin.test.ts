import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import {
  getAdminDashboard,
  listUsers,
  getUserDetail,
  banUser,
  unbanUser,
  listDisputes,
} from '../admin';

vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('admin API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAdminDashboard calls GET /admin/dashboard', async () => {
    const mockData = { totalUsers: 100, totalRequests: 50 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getAdminDashboard();

    expect(apiClient.get).toHaveBeenCalledWith('/admin/dashboard');
    expect(result).toEqual(mockData);
  });

  it('listUsers calls GET /admin/users with role filter', async () => {
    const mockPage = { content: [{ id: 1, name: 'Admin' }], totalElements: 1 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await listUsers('CLIENT', 0, 10);

    expect(apiClient.get).toHaveBeenCalledWith('/admin/users', {
      params: { page: 0, size: 10, role: 'CLIENT' },
    });
    expect(result).toEqual(mockPage);
  });

  it('listUsers calls GET /admin/users without role when not specified', async () => {
    const mockPage = { content: [], totalElements: 0 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    await listUsers(undefined, 0, 20);

    expect(apiClient.get).toHaveBeenCalledWith('/admin/users', {
      params: { page: 0, size: 20 },
    });
  });

  it('getUserDetail calls GET /admin/users/{id}', async () => {
    const mockData = { id: 5, name: 'Test User', email: 'test@test.pt' };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getUserDetail(5);

    expect(apiClient.get).toHaveBeenCalledWith('/admin/users/5');
    expect(result).toEqual(mockData);
  });

  it('banUser calls POST /admin/users/{id}/ban', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({});

    await banUser(5);

    expect(apiClient.post).toHaveBeenCalledWith('/admin/users/5/ban');
  });

  it('unbanUser calls POST /admin/users/{id}/unban', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({});

    await unbanUser(5);

    expect(apiClient.post).toHaveBeenCalledWith('/admin/users/5/unban');
  });

  it('listDisputes calls GET /admin/disputes with page/size', async () => {
    const mockPage = { content: [], totalElements: 0 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await listDisputes(1, 5);

    expect(apiClient.get).toHaveBeenCalledWith('/admin/disputes', {
      params: { page: 1, size: 5 },
    });
    expect(result).toEqual(mockPage);
  });
});

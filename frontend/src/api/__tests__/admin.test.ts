import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import {
  getAdminDashboard,
  getAdminAnalytics,
  listUsers,
  getUserDetail,
  banUser,
  unbanUser,
  listDisputes,
  listAdminListings,
  removeAdminListing,
} from '../admin';

vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
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

  it('getAdminAnalytics calls GET /admin/analytics', async () => {
    const mockData = { usersByRole: [], requestsByStatus: [], registrationsDaily: [], requestsDaily: [], revenueDaily: [] };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getAdminAnalytics();

    expect(apiClient.get).toHaveBeenCalledWith('/admin/analytics');
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

  it('listAdminListings calls GET /admin/listings with status filter', async () => {
    const mockPage = { content: [], totalElements: 0 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    await listAdminListings('ACTIVE', 0, 20);

    expect(apiClient.get).toHaveBeenCalledWith('/admin/listings', {
      params: { page: 0, size: 20, status: 'ACTIVE' },
    });
  });

  it('listAdminListings omits status when not provided', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { content: [], totalElements: 0 } });

    await listAdminListings(undefined, 1, 10);

    expect(apiClient.get).toHaveBeenCalledWith('/admin/listings', { params: { page: 1, size: 10 } });
  });

  it('removeAdminListing calls DELETE /admin/listings/{id}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({});

    await removeAdminListing(7);

    expect(apiClient.delete).toHaveBeenCalledWith('/admin/listings/7');
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

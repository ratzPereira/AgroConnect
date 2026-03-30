import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import {
  listTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deactivateTeamMember,
} from '../teamMembers';

vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('teamMembers API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listTeamMembers calls GET /providers/me/team', async () => {
    const mockData = [{ id: 1, name: 'Joao' }, { id: 2, name: 'Maria' }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await listTeamMembers();

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/team');
    expect(result).toEqual(mockData);
  });

  it('getTeamMember calls GET /providers/me/team/{id}', async () => {
    const mockData = { id: 1, name: 'Joao', role: 'OPERATOR' };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getTeamMember(1);

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/team/1');
    expect(result).toEqual(mockData);
  });

  it('createTeamMember calls POST /providers/me/team', async () => {
    const dto = { name: 'Pedro', email: 'pedro@test.pt', role: 'OPERATOR' };
    const mockData = { id: 3, ...dto };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await createTeamMember(dto as never);

    expect(apiClient.post).toHaveBeenCalledWith('/providers/me/team', dto);
    expect(result).toEqual(mockData);
  });

  it('updateTeamMember calls PUT /providers/me/team/{id}', async () => {
    const dto = { name: 'Pedro Updated' };
    const mockData = { id: 3, name: 'Pedro Updated' };
    vi.mocked(apiClient.put).mockResolvedValue({ data: mockData });

    const result = await updateTeamMember(3, dto as never);

    expect(apiClient.put).toHaveBeenCalledWith('/providers/me/team/3', dto);
    expect(result).toEqual(mockData);
  });

  it('deactivateTeamMember calls DELETE /providers/me/team/{id}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({});

    await deactivateTeamMember(3);

    expect(apiClient.delete).toHaveBeenCalledWith('/providers/me/team/3');
  });
});

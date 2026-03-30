import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import { listMachines, getMachine, createMachine, updateMachine, deleteMachine } from '../machines';

vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('machines API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listMachines calls GET /providers/me/machines with status filter', async () => {
    const mockData = [{ id: 1, name: 'Trator' }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await listMachines('ACTIVE');

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/machines', {
      params: { status: 'ACTIVE' },
    });
    expect(result).toEqual(mockData);
  });

  it('listMachines calls GET /providers/me/machines without params when no status', async () => {
    const mockData = [{ id: 1, name: 'Trator' }, { id: 2, name: 'Pulverizador' }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await listMachines();

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/machines', {
      params: undefined,
    });
    expect(result).toEqual(mockData);
  });

  it('getMachine calls GET /providers/me/machines/{id}', async () => {
    const mockData = { id: 1, name: 'Trator', brand: 'John Deere' };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getMachine(1);

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/machines/1');
    expect(result).toEqual(mockData);
  });

  it('createMachine calls POST /providers/me/machines', async () => {
    const dto = { name: 'Novo Trator', brand: 'Massey Ferguson' };
    const mockData = { id: 3, ...dto };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await createMachine(dto as never);

    expect(apiClient.post).toHaveBeenCalledWith('/providers/me/machines', dto);
    expect(result).toEqual(mockData);
  });

  it('updateMachine calls PUT /providers/me/machines/{id}', async () => {
    const dto = { name: 'Trator Atualizado' };
    const mockData = { id: 1, name: 'Trator Atualizado' };
    vi.mocked(apiClient.put).mockResolvedValue({ data: mockData });

    const result = await updateMachine(1, dto as never);

    expect(apiClient.put).toHaveBeenCalledWith('/providers/me/machines/1', dto);
    expect(result).toEqual(mockData);
  });

  it('deleteMachine calls DELETE /providers/me/machines/{id}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({});

    await deleteMachine(1);

    expect(apiClient.delete).toHaveBeenCalledWith('/providers/me/machines/1');
  });
});

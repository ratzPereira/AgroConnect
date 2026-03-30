import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import {
  listInventory,
  getLowStockItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '../inventory';

vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('inventory API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listInventory calls GET /providers/me/inventory', async () => {
    const mockData = [{ id: 1, name: 'Fertilizante', quantity: 50 }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await listInventory();

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/inventory');
    expect(result).toEqual(mockData);
  });

  it('getLowStockItems calls GET /providers/me/inventory/low-stock', async () => {
    const mockData = [{ id: 2, name: 'Herbicida', quantity: 2 }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getLowStockItems();

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/inventory/low-stock');
    expect(result).toEqual(mockData);
  });

  it('getInventoryItem calls GET /providers/me/inventory/{id}', async () => {
    const mockData = { id: 1, name: 'Fertilizante', quantity: 50, unit: 'kg' };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getInventoryItem(1);

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/inventory/1');
    expect(result).toEqual(mockData);
  });

  it('createInventoryItem calls POST /providers/me/inventory', async () => {
    const dto = { name: 'Sementes', quantity: 100, unit: 'kg' };
    const mockData = { id: 3, ...dto };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await createInventoryItem(dto as never);

    expect(apiClient.post).toHaveBeenCalledWith('/providers/me/inventory', dto);
    expect(result).toEqual(mockData);
  });

  it('updateInventoryItem calls PUT /providers/me/inventory/{id}', async () => {
    const dto = { quantity: 75 };
    const mockData = { id: 1, name: 'Fertilizante', quantity: 75 };
    vi.mocked(apiClient.put).mockResolvedValue({ data: mockData });

    const result = await updateInventoryItem(1, dto as never);

    expect(apiClient.put).toHaveBeenCalledWith('/providers/me/inventory/1', dto);
    expect(result).toEqual(mockData);
  });

  it('deleteInventoryItem calls DELETE /providers/me/inventory/{id}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({});

    await deleteInventoryItem(1);

    expect(apiClient.delete).toHaveBeenCalledWith('/providers/me/inventory/1');
  });
});

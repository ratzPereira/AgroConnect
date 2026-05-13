import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import {
  listInventory,
  getLowStockItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  listMovements,
  recordPurchase,
  recordAdjustmentIn,
  recordAdjustmentOut,
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
    const mockData = [{ id: 1, productName: 'Fertilizante', quantity: 50 }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await listInventory();

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/inventory');
    expect(result).toEqual(mockData);
  });

  it('getLowStockItems calls GET /providers/me/inventory/low-stock', async () => {
    const mockData = [{ id: 2, productName: 'Herbicida', quantity: 2 }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getLowStockItems();

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/inventory/low-stock');
    expect(result).toEqual(mockData);
  });

  it('getInventoryItem calls GET /providers/me/inventory/{id}', async () => {
    const mockData = { id: 1, productName: 'Fertilizante', quantity: 50, unit: 'KG' };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getInventoryItem(1);

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/inventory/1');
    expect(result).toEqual(mockData);
  });

  it('createInventoryItem calls POST /providers/me/inventory', async () => {
    const dto = { productName: 'Sementes', quantity: 100, unit: 'KG' as const };
    const mockData = { id: 3, ...dto };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await createInventoryItem(dto);

    expect(apiClient.post).toHaveBeenCalledWith('/providers/me/inventory', dto);
    expect(result).toEqual(mockData);
  });

  it('updateInventoryItem calls PUT /providers/me/inventory/{id} with metadata-only payload', async () => {
    const dto = { productName: 'Fertilizante NPK', minStockAlert: 10 };
    const mockData = { id: 1, ...dto, quantity: 50 };
    vi.mocked(apiClient.put).mockResolvedValue({ data: mockData });

    const result = await updateInventoryItem(1, dto);

    expect(apiClient.put).toHaveBeenCalledWith('/providers/me/inventory/1', dto);
    expect(result).toEqual(mockData);
  });

  it('deleteInventoryItem calls DELETE /providers/me/inventory/{id}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({});

    await deleteInventoryItem(1);

    expect(apiClient.delete).toHaveBeenCalledWith('/providers/me/inventory/1');
  });

  it('listMovements calls GET /providers/me/inventory/{id}/movements with page params', async () => {
    const mockPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10, first: true, last: true };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await listMovements(7, 2, 10);

    expect(apiClient.get).toHaveBeenCalledWith(
      '/providers/me/inventory/7/movements',
      { params: { page: 2, size: 10 } },
    );
    expect(result).toEqual(mockPage);
  });

  it('listMovements defaults page and size when omitted', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true } });

    await listMovements(7);

    expect(apiClient.get).toHaveBeenCalledWith(
      '/providers/me/inventory/7/movements',
      { params: { page: 0, size: 20 } },
    );
  });

  it('recordPurchase calls POST /providers/me/inventory/{id}/movements/purchase', async () => {
    const dto = { quantity: 100, unitCost: 1.45, reason: 'Repsol' };
    const mockData = { id: 11, movementType: 'PURCHASE', quantityDelta: 100, quantityAfter: 600 };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await recordPurchase(5, dto);

    expect(apiClient.post).toHaveBeenCalledWith('/providers/me/inventory/5/movements/purchase', dto);
    expect(result).toEqual(mockData);
  });

  it('recordAdjustmentIn calls POST /providers/me/inventory/{id}/movements/adjustment-in', async () => {
    const dto = { quantity: 50, reason: 'Stock encontrado' };
    const mockData = { id: 12, movementType: 'ADJUSTMENT_IN', quantityDelta: 50, quantityAfter: 650 };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await recordAdjustmentIn(5, dto);

    expect(apiClient.post).toHaveBeenCalledWith('/providers/me/inventory/5/movements/adjustment-in', dto);
    expect(result).toEqual(mockData);
  });

  it('recordAdjustmentOut calls POST /providers/me/inventory/{id}/movements/adjustment-out', async () => {
    const dto = { quantity: 100, reason: 'Estragado' };
    const mockData = { id: 13, movementType: 'ADJUSTMENT_OUT', quantityDelta: -100, quantityAfter: 550 };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await recordAdjustmentOut(5, dto);

    expect(apiClient.post).toHaveBeenCalledWith('/providers/me/inventory/5/movements/adjustment-out', dto);
    expect(result).toEqual(mockData);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import { deleteAccount, exportMyData } from '../account';

vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('account API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deleteAccount calls DELETE /account with password in data', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({});

    await deleteAccount('mySecurePassword');

    expect(apiClient.delete).toHaveBeenCalledWith('/account', {
      data: { password: 'mySecurePassword' },
    });
  });

  it('exportMyData calls GET /account/export with blob responseType', async () => {
    const mockBlobData = '{"name":"test"}';
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockBlobData });

    const mockUrl = 'blob:http://localhost/fake-export';
    const createObjectURLSpy = vi.fn().mockReturnValue(mockUrl);
    const revokeObjectURLSpy = vi.fn();
    URL.createObjectURL = createObjectURLSpy;
    URL.revokeObjectURL = revokeObjectURLSpy;

    const mockLink = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);

    await exportMyData();

    expect(apiClient.get).toHaveBeenCalledWith('/account/export', {
      responseType: 'blob',
    });
    expect(mockLink.download).toBe('agroconnect-dados.json');
    expect(mockLink.click).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockUrl);
  });

  it('exportMyData creates blob with application/json type', async () => {
    const mockBlobData = '{"data":"export"}';
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockBlobData });

    const blobSpy = vi.fn().mockImplementation(function (this: Blob) {
      return this;
    });
    global.Blob = blobSpy as unknown as typeof Blob;

    URL.createObjectURL = vi.fn().mockReturnValue('blob:fake');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLElement);

    await exportMyData();

    expect(blobSpy).toHaveBeenCalledWith([mockBlobData], { type: 'application/json' });
  });
});

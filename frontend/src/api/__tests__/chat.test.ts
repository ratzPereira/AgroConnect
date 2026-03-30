import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import { getMessages, sendMessage } from '../chat';

vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('chat API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMessages calls GET /requests/{id}/messages with page/size', async () => {
    const mockPage = { content: [{ id: 1, content: 'Ola' }], totalElements: 1 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await getMessages(5, 0, 30);

    expect(apiClient.get).toHaveBeenCalledWith('/requests/5/messages', {
      params: { page: 0, size: 30 },
    });
    expect(result).toEqual(mockPage);
  });

  it('sendMessage calls POST /requests/{id}/messages', async () => {
    const messageData = { content: 'Bom dia, quando pode comecar?' };
    const mockData = { id: 1, ...messageData };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await sendMessage(5, messageData as never);

    expect(apiClient.post).toHaveBeenCalledWith('/requests/5/messages', messageData);
    expect(result).toEqual(mockData);
  });
});

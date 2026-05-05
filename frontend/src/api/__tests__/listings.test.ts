import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import {
  searchListings,
  getListingById,
  createListing,
  updateListing,
  markListingSold,
  removeListing,
  getMyListings,
  getMyListingStats,
  getListingUploadUrl,
  confirmListingPhoto,
  deleteListingPhoto,
  toggleFavorite,
  getMyFavorites,
  sendListingMessage,
  getMyConversations,
  getConversationMessages,
  replyToConversation,
  markConversationRead,
} from '../listings';

vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('listings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searchListings calls GET /listings with query params built from filters', async () => {
    const mockPage = { content: [], totalElements: 0 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await searchListings({
      page: 0,
      size: 10,
      search: 'trator',
      category: 'MACHINERY',
      island: 'Terceira',
      minPrice: 100,
      maxPrice: 5000,
      latitude: 38.65,
      longitude: -27.21,
      radiusKm: 50,
    });

    expect(apiClient.get).toHaveBeenCalledWith('/listings', {
      params: {
        page: 0,
        size: 10,
        q: 'trator',
        category: 'MACHINERY',
        island: 'Terceira',
        minPrice: 100,
        maxPrice: 5000,
        lat: 38.65,
        lng: -27.21,
        radius: 50,
      },
    });
    expect(result).toEqual(mockPage);
  });

  it('searchListings uses defaults and omits undefined filters', async () => {
    const mockPage = { content: [], totalElements: 0 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    await searchListings({});

    expect(apiClient.get).toHaveBeenCalledWith('/listings', {
      params: { page: 0, size: 20 },
    });
  });

  it('getListingById calls GET /listings/{id}', async () => {
    const mockData = { id: 5, title: 'Trator usado' };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getListingById(5);

    expect(apiClient.get).toHaveBeenCalledWith('/listings/5');
    expect(result).toEqual(mockData);
  });

  it('createListing calls POST /listings', async () => {
    const dto = { title: 'Novo trator', price: 3000 };
    const mockData = { id: 1, ...dto };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await createListing(dto as never);

    expect(apiClient.post).toHaveBeenCalledWith('/listings', dto);
    expect(result).toEqual(mockData);
  });

  it('updateListing calls PUT /listings/{id}', async () => {
    const dto = { title: 'Trator atualizado', price: 2500 };
    const mockData = { id: 5, ...dto };
    vi.mocked(apiClient.put).mockResolvedValue({ data: mockData });

    const result = await updateListing(5, dto as never);

    expect(apiClient.put).toHaveBeenCalledWith('/listings/5', dto);
    expect(result).toEqual(mockData);
  });

  it('markListingSold calls POST /listings/{id}/sold', async () => {
    const mockData = { id: 5, status: 'SOLD' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await markListingSold(5);

    expect(apiClient.post).toHaveBeenCalledWith('/listings/5/sold');
    expect(result).toEqual(mockData);
  });

  it('removeListing calls DELETE /listings/{id}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({});

    await removeListing(5);

    expect(apiClient.delete).toHaveBeenCalledWith('/listings/5');
  });

  it('getMyListings calls GET /listings/me with page/size/status', async () => {
    const mockPage = { content: [], totalElements: 0 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await getMyListings(0, 10, 'ACTIVE');

    expect(apiClient.get).toHaveBeenCalledWith('/listings/me', {
      params: { page: 0, size: 10, status: 'ACTIVE' },
    });
    expect(result).toEqual(mockPage);
  });

  it('getMyListingStats calls GET /listings/me/stats', async () => {
    const mockData = { totalListings: 5, activeListings: 3, totalViews: 100 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getMyListingStats();

    expect(apiClient.get).toHaveBeenCalledWith('/listings/me/stats');
    expect(result).toEqual(mockData);
  });

  it('getListingUploadUrl calls POST /listings/{id}/photos/upload-url', async () => {
    const mockData = { uploadUrl: 'https://minio.local/upload', fileUrl: 'https://minio.local/photo.jpg' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await getListingUploadUrl(5);

    expect(apiClient.post).toHaveBeenCalledWith('/listings/5/photos/upload-url');
    expect(result).toEqual(mockData);
  });

  it('confirmListingPhoto calls POST /listings/{id}/photos', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({});

    await confirmListingPhoto(5, 'https://minio.local/photo.jpg');

    expect(apiClient.post).toHaveBeenCalledWith('/listings/5/photos', {
      photoUrl: 'https://minio.local/photo.jpg',
    });
  });

  it('deleteListingPhoto calls DELETE /listings/{id}/photos/{photoId}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({});

    await deleteListingPhoto(5, 3);

    expect(apiClient.delete).toHaveBeenCalledWith('/listings/5/photos/3');
  });

  it('toggleFavorite calls POST /listings/{id}/favorite', async () => {
    const mockData = { favorited: true };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await toggleFavorite(5);

    expect(apiClient.post).toHaveBeenCalledWith('/listings/5/favorite');
    expect(result).toEqual(mockData);
  });

  it('getMyFavorites calls GET /listings/favorites with page/size', async () => {
    const mockPage = { content: [], totalElements: 0 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await getMyFavorites(0, 10);

    expect(apiClient.get).toHaveBeenCalledWith('/listings/favorites', {
      params: { page: 0, size: 10 },
    });
    expect(result).toEqual(mockPage);
  });

  it('sendListingMessage calls POST /listings/{id}/messages', async () => {
    const mockData = { id: 1, content: 'Ainda esta disponivel?' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await sendListingMessage(5, 'Ainda esta disponivel?');

    expect(apiClient.post).toHaveBeenCalledWith('/listings/5/messages', {
      content: 'Ainda esta disponivel?',
    });
    expect(result).toEqual(mockData);
  });

  it('getMyConversations calls GET /listings/conversations with page/size', async () => {
    const mockPage = { content: [], totalElements: 0 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await getMyConversations(0, 10);

    expect(apiClient.get).toHaveBeenCalledWith('/listings/conversations', {
      params: { page: 0, size: 10 },
    });
    expect(result).toEqual(mockPage);
  });

  it('getConversationMessages calls GET /listings/conversations/{id}/messages', async () => {
    const mockPage = { content: [{ id: 1, content: 'Ola' }], totalElements: 1 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await getConversationMessages(7, 0, 25);

    expect(apiClient.get).toHaveBeenCalledWith('/listings/conversations/7/messages', {
      params: { page: 0, size: 25 },
    });
    expect(result).toEqual(mockPage);
  });

  it('replyToConversation calls POST /listings/conversations/{id}/messages', async () => {
    const mockData = { id: 2, content: 'Sim, esta disponivel' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await replyToConversation(7, 'Sim, esta disponivel');

    expect(apiClient.post).toHaveBeenCalledWith('/listings/conversations/7/messages', {
      content: 'Sim, esta disponivel',
    });
    expect(result).toEqual(mockData);
  });

  it('markConversationRead calls POST /listings/conversations/{id}/read', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({});

    await markConversationRead(7);

    expect(apiClient.post).toHaveBeenCalledWith('/listings/conversations/7/read');
  });
});

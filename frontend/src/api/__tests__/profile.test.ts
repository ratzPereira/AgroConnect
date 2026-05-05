import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import {
  getMyProfile,
  updateClientProfile,
  updateProviderProfile,
  isProviderProfile,
} from '../profile';
import type { ClientProfileData, ProviderProfileData } from '../profile';

vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMyProfile calls GET /profile/me', async () => {
    const mockData = { id: 1, name: 'Farmer Test', phone: '912345678' };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getMyProfile();

    expect(apiClient.get).toHaveBeenCalledWith('/profile/me');
    expect(result).toEqual(mockData);
  });

  it('updateClientProfile calls PUT /profile/me/client', async () => {
    const updateData = { name: 'Updated Name', phone: '912345678' };
    const mockData = { id: 1, ...updateData };
    vi.mocked(apiClient.put).mockResolvedValue({ data: mockData });

    const result = await updateClientProfile(updateData);

    expect(apiClient.put).toHaveBeenCalledWith('/profile/me/client', updateData);
    expect(result).toEqual(mockData);
  });

  it('updateProviderProfile calls PUT /profile/me/provider', async () => {
    const updateData = { companyName: 'AgroServices Lda', nif: '123456789' };
    const mockData = { id: 1, ...updateData, verified: true };
    vi.mocked(apiClient.put).mockResolvedValue({ data: mockData });

    const result = await updateProviderProfile(updateData);

    expect(apiClient.put).toHaveBeenCalledWith('/profile/me/provider', updateData);
    expect(result).toEqual(mockData);
  });

  it('isProviderProfile returns true for provider data and false for client data', () => {
    const providerProfile: ProviderProfileData = {
      id: 1,
      companyName: 'AgroServices Lda',
      nif: '123456789',
      phone: '912345678',
      description: 'Service provider',
      serviceRadiusKm: 50,
      avgRating: 4.5,
      totalReviews: 10,
      verified: true,
      latitude: 38.65,
      longitude: -27.21,
      island: 'Terceira',
      municipality: 'Angra do Heroismo',
      parish: 'Se',
      profileComplete: true,
    };
    const clientProfile: ClientProfileData = {
      id: 2,
      name: 'Farmer Test',
      phone: '912345678',
      parish: 'Se',
      municipality: 'Angra do Heroismo',
      island: 'Terceira',
      latitude: 38.65,
      longitude: -27.21,
    };

    expect(isProviderProfile(providerProfile)).toBe(true);
    expect(isProviderProfile(clientProfile)).toBe(false);
  });
});

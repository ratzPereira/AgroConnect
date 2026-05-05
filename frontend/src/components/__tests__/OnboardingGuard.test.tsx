import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { UserResponse } from '@/types/auth';

let mockUser: UserResponse | null = null;
let mockProfile: Record<string, unknown> | null = null;
let mockIsLoading = false;

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (state: { user: UserResponse | null }) => unknown) =>
    selector({ user: mockUser }),
  ),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: mockProfile,
    isLoading: mockIsLoading,
  })),
}));

vi.mock('@/api/profile', () => ({
  getMyProfile: vi.fn(),
  isProviderProfile: vi.fn((profile: Record<string, unknown>) => 'companyName' in profile),
}));

import { OnboardingGuard } from '../OnboardingGuard';

function renderWithRouter(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<OnboardingGuard />}>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/calendar" element={<div>Calendar</div>} />
        </Route>
        <Route path="/onboarding" element={<div>Onboarding Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('OnboardingGuard', () => {
  afterEach(() => {
    mockUser = null;
    mockProfile = null;
    mockIsLoading = false;
    cleanup();
    vi.clearAllMocks();
  });

  it('renders children when provider is onboarded', () => {
    mockUser = { id: 1, email: 'provider@test.com', name: 'Provider', role: 'PROVIDER_MANAGER' };
    mockProfile = {
      id: 1,
      companyName: 'Farm Co',
      profileComplete: true,
      verified: false,
      nif: null,
      phone: null,
      description: null,
      serviceRadiusKm: null,
      avgRating: null,
      totalReviews: null,
      latitude: null,
      longitude: null,
      island: null,
      municipality: null,
      parish: null,
    };

    renderWithRouter('/dashboard');
    expect(document.body.textContent).toContain('Dashboard');
  });

  it('redirects to onboarding when provider profile is incomplete', () => {
    mockUser = { id: 1, email: 'provider@test.com', name: 'Provider', role: 'PROVIDER_MANAGER' };
    mockProfile = {
      id: 1,
      companyName: 'Farm Co',
      profileComplete: false,
      verified: false,
      nif: null,
      phone: null,
      description: null,
      serviceRadiusKm: null,
      avgRating: null,
      totalReviews: null,
      latitude: null,
      longitude: null,
      island: null,
      municipality: null,
      parish: null,
    };

    renderWithRouter('/dashboard');
    expect(document.body.textContent).toContain('Onboarding Page');
    expect(document.body.textContent).not.toContain('Dashboard');
  });

  it('passes through for non-provider roles', () => {
    mockUser = { id: 2, email: 'client@test.com', name: 'Client', role: 'CLIENT' };
    mockProfile = null;

    renderWithRouter('/dashboard');
    expect(document.body.textContent).toContain('Dashboard');
  });

  it('renders outlet while loading for providers', () => {
    mockUser = { id: 1, email: 'provider@test.com', name: 'Provider', role: 'PROVIDER_MANAGER' };
    mockProfile = null;
    mockIsLoading = true;

    renderWithRouter('/dashboard');
    expect(document.body.textContent).toContain('Dashboard');
  });
});

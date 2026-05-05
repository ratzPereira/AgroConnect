import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { CreateListing } from '../CreateListing';

vi.mock('@/api/listings', () => ({
  createListing: vi.fn(),
  getListingUploadUrl: vi.fn(),
  confirmListingPhoto: vi.fn(),
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/features/requests/components/LocationPicker', () => ({
  LocationPicker: () => <div data-testid="location-picker" />,
}));

describe('CreateListing', () => {
  it('renders listing creation form with heading', () => {
    renderWithProviders(<CreateListing />, { route: '/marketplace/new' });
    expect(screen.getByText('Novo Anúncio')).toBeInTheDocument();
  });

  it('has required form sections (category, details, location)', () => {
    renderWithProviders(<CreateListing />, { route: '/marketplace/new' });
    expect(screen.getByText('Categoria')).toBeInTheDocument();
    expect(screen.getByText('Detalhes')).toBeInTheDocument();
    expect(screen.getByText('Localização')).toBeInTheDocument();
  });
});

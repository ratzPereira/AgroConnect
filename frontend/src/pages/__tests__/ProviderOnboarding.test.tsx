import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ProviderOnboarding } from '../ProviderOnboarding';

vi.mock('@/api/profile', () => ({
  updateProviderProfile: vi.fn(),
}));

vi.mock('@/features/requests/components/LocationPicker', () => ({
  LocationPicker: () => <div data-testid="location-picker" />,
}));

describe('ProviderOnboarding', () => {
  it('renders onboarding form with heading', () => {
    renderWithProviders(<ProviderOnboarding />, { route: '/onboarding' });
    expect(screen.getByText('Configure a sua area de atuacao')).toBeInTheDocument();
  });

  it('shows step indicator with location step active', () => {
    renderWithProviders(<ProviderOnboarding />, { route: '/onboarding' });
    expect(screen.getByText('Localizacao')).toBeInTheDocument();
    expect(screen.getByText('Area de Servico')).toBeInTheDocument();
    expect(screen.getByText('Concluir')).toBeInTheDocument();
  });
});

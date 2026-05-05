import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { CreateRequest } from '../CreateRequest';

vi.mock('@/api/requests', () => ({
  createRequest: vi.fn(),
  publishRequest: vi.fn(),
  getUploadUrl: vi.fn(),
  confirmPhoto: vi.fn(),
}));

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(() =>
      Promise.resolve({
        data: [
          { id: 1, name: 'Lavoura', slug: 'lavoura', description: 'Serviço de lavoura', formSchema: null },
          { id: 2, name: 'Pulverização', slug: 'pulverizacao', description: 'Serviço de pulverização', formSchema: null },
        ],
      }),
    ),
  },
}));

vi.mock('@/features/requests/components/LocationPicker', () => ({
  LocationPicker: () => <div data-testid="location-picker" />,
}));

vi.mock('@/features/requests/components/DynamicForm', () => ({
  DynamicForm: () => null,
}));

vi.mock('@/features/requests/components/WizardPhotoCollector', () => ({
  WizardPhotoCollector: () => <div data-testid="photo-collector" />,
}));

describe('CreateRequest', () => {
  it('renders create request wizard heading', () => {
    renderWithProviders(<CreateRequest />, { route: '/requests/new' });
    expect(screen.getByText('Novo Pedido de Serviço')).toBeInTheDocument();
  });

  it('shows first step of wizard (category selection)', async () => {
    renderWithProviders(<CreateRequest />, { route: '/requests/new' });
    expect(screen.getByText('Categoria')).toBeInTheDocument();
    // Should show the step indicator
    expect(screen.getByText('Detalhes')).toBeInTheDocument();
    expect(screen.getByText('Localização')).toBeInTheDocument();
    // Categories should load
    await waitFor(() => {
      expect(screen.getByText('Lavoura')).toBeInTheDocument();
    });
  });
});

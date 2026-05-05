import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ProviderOnboarding } from '../ProviderOnboarding';

/* -- Mocks ---------------------------------------------------------- */

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/api/profile', () => ({
  updateProviderProfile: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/features/requests/components/LocationPicker', () => ({
  LocationPicker: () => <div data-testid="location-picker">LocationPicker</div>,
}));

vi.mock('@/features/requests/data/azoresLocations', () => ({
  AZORES_ISLANDS: [
    {
      name: 'São Miguel',
      lat: 37.75,
      lng: -25.67,
      zoom: 11,
      municipalities: [
        {
          name: 'Ponta Delgada',
          lat: 37.74,
          lng: -25.67,
          parishes: [{ name: 'Fajã de Baixo', lat: 37.75, lng: -25.65 }],
        },
      ],
    },
  ],
  AZORES_BOUNDS: { minLat: 36.9, maxLat: 39.8, minLng: -31.3, maxLng: -24.7 },
  AZORES_CENTER: { lat: 38.5, lng: -28.0, zoom: 7 },
  findIsland: vi.fn((name: string) =>
    name === 'São Miguel'
      ? {
          name: 'São Miguel',
          lat: 37.75,
          lng: -25.67,
          zoom: 11,
          municipalities: [
            {
              name: 'Ponta Delgada',
              lat: 37.74,
              lng: -25.67,
              parishes: [{ name: 'Fajã de Baixo', lat: 37.75, lng: -25.65 }],
            },
          ],
        }
      : undefined,
  ),
  findMunicipality: vi.fn((island: string, muni: string) =>
    island === 'São Miguel' && muni === 'Ponta Delgada'
      ? {
          name: 'Ponta Delgada',
          lat: 37.74,
          lng: -25.67,
          parishes: [{ name: 'Fajã de Baixo', lat: 37.75, lng: -25.65 }],
        }
      : undefined,
  ),
  findParish: vi.fn((_island: string, _muni: string, parish: string) =>
    parish === 'Fajã de Baixo'
      ? { name: 'Fajã de Baixo', lat: 37.75, lng: -25.65 }
      : undefined,
  ),
}));

/* -- Helpers --------------------------------------------------------- */

/**
 * Fills step 0 (island + municipality) and clicks Seguinte to advance.
 * Municipality selection triggers setValue for latitude/longitude via findMunicipality.
 */
async function advancePastStep0() {
  // Select island
  fireEvent.change(screen.getByLabelText('Ilha *'), {
    target: { value: 'São Miguel' },
  });

  // Wait for municipality dropdown to become enabled
  await waitFor(() => {
    expect(screen.getByLabelText('Municipio *')).not.toBeDisabled();
  });

  // Select municipality (this sets lat/lng via handleMunicipalityChange)
  fireEvent.change(screen.getByLabelText('Municipio *'), {
    target: { value: 'Ponta Delgada' },
  });

  // Click Seguinte and wait for step 1 to render
  fireEvent.click(screen.getByText('Seguinte'));
  await waitFor(() => {
    expect(screen.getByText('Area de servico')).toBeInTheDocument();
  });
}

/**
 * Fills step 1 (service radius) and clicks Seguinte to advance to step 2.
 */
async function advancePastStep1() {
  fireEvent.change(screen.getByLabelText('Raio de servico (km) *'), {
    target: { value: '30' },
  });

  fireEvent.click(screen.getByText('Seguinte'));
  await waitFor(() => {
    expect(screen.getByText('Tudo pronto!')).toBeInTheDocument();
  });
}

/* -- Tests ----------------------------------------------------------- */

describe('ProviderOnboarding — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Page title
  it('renders page title "Configure a sua area de atuacao"', () => {
    renderWithProviders(<ProviderOnboarding />, { route: '/onboarding' });
    expect(screen.getByText('Configure a sua area de atuacao')).toBeInTheDocument();
  });

  // 2. Step indicator with 3 steps
  it('renders step indicator with 3 steps (Localizacao, Area de Servico, Concluir)', () => {
    renderWithProviders(<ProviderOnboarding />, { route: '/onboarding' });
    expect(screen.getByText('Localizacao')).toBeInTheDocument();
    expect(screen.getByText('Area de Servico')).toBeInTheDocument();
    expect(screen.getByText('Concluir')).toBeInTheDocument();
  });

  // 3. Step 0: island dropdown with option
  it('step 0: renders island dropdown with "São Miguel" option', () => {
    renderWithProviders(<ProviderOnboarding />, { route: '/onboarding' });

    const islandSelect = screen.getByLabelText('Ilha *');
    expect(islandSelect).toBeInTheDocument();

    // The dropdown should contain "São Miguel" as an option
    const options = islandSelect.querySelectorAll('option');
    const optionTexts = Array.from(options).map((o) => o.textContent);
    expect(optionTexts).toContain('São Miguel');
  });

  // 4. Step 0: municipality dropdown disabled initially
  it('step 0: renders municipality dropdown disabled when no island selected', () => {
    renderWithProviders(<ProviderOnboarding />, { route: '/onboarding' });

    const municipalitySelect = screen.getByLabelText('Municipio *');
    expect(municipalitySelect).toBeInTheDocument();
    expect(municipalitySelect).toBeDisabled();
  });

  // 5. Municipality enabled after island selection
  it('step 0: municipality dropdown enabled after island selection', async () => {
    renderWithProviders(<ProviderOnboarding />, { route: '/onboarding' });

    const municipalitySelect = screen.getByLabelText('Municipio *');
    expect(municipalitySelect).toBeDisabled();

    // Select an island
    fireEvent.change(screen.getByLabelText('Ilha *'), {
      target: { value: 'São Miguel' },
    });

    // Municipality should now be enabled
    await waitFor(() => {
      expect(municipalitySelect).not.toBeDisabled();
    });

    // Verify "Ponta Delgada" appears as an option
    const options = municipalitySelect.querySelectorAll('option');
    const optionTexts = Array.from(options).map((o) => o.textContent);
    expect(optionTexts).toContain('Ponta Delgada');
  });

  // 6. Step 0: LocationPicker renders
  it('step 0: renders LocationPicker component', () => {
    renderWithProviders(<ProviderOnboarding />, { route: '/onboarding' });
    expect(screen.getByTestId('location-picker')).toBeInTheDocument();
  });

  // 7. Step 0: location validation error on Seguinte without selections
  it('step 0: shows location validation error when clicking Seguinte without filling fields', async () => {
    renderWithProviders(<ProviderOnboarding />, { route: '/onboarding' });

    fireEvent.click(screen.getByText('Seguinte'));

    // Should show validation errors — island is required
    await waitFor(() => {
      expect(screen.getByText('Selecione uma ilha')).toBeInTheDocument();
    });
  });

  // 8. Seguinte button on step 0
  it('shows "Seguinte" button on step 0 and no "Anterior" button', () => {
    renderWithProviders(<ProviderOnboarding />, { route: '/onboarding' });
    expect(screen.getByText('Seguinte')).toBeInTheDocument();
    expect(screen.queryByText('Anterior')).not.toBeInTheDocument();
  });

  // 9. Step 1: service radius input
  it('step 1: renders service radius input', async () => {
    renderWithProviders(<ProviderOnboarding />, { route: '/onboarding' });
    await advancePastStep0();

    expect(screen.getByLabelText('Raio de servico (km) *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ex: 30')).toBeInTheDocument();
  });

  // 10. Step 1: phone input
  it('step 1: renders phone input', async () => {
    renderWithProviders(<ProviderOnboarding />, { route: '/onboarding' });
    await advancePastStep0();

    expect(screen.getByLabelText('Telefone')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+351 912 345 678')).toBeInTheDocument();
  });

  // 11. Step 1: description textarea
  it('step 1: renders description textarea', async () => {
    renderWithProviders(<ProviderOnboarding />, { route: '/onboarding' });
    await advancePastStep0();

    expect(screen.getByLabelText('Descricao da empresa')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Descreva brevemente os servicos que oferece...'),
    ).toBeInTheDocument();
  });

  // 12. Step 2: "Tudo pronto!" heading
  it('step 2: renders "Tudo pronto!" heading', async () => {
    renderWithProviders(<ProviderOnboarding />, { route: '/onboarding' });
    await advancePastStep0();
    await advancePastStep1();

    expect(screen.getByText('Tudo pronto!')).toBeInTheDocument();
    expect(screen.getByText('Confirme os seus dados antes de comecar.')).toBeInTheDocument();
  });

  // 13. Step 2: location summary
  it('step 2: shows location summary with municipality and island', async () => {
    renderWithProviders(<ProviderOnboarding />, { route: '/onboarding' });
    await advancePastStep0();
    await advancePastStep1();

    // The summary joins parish, municipality, island (filtering empty)
    // Since no parish was selected: "Ponta Delgada, São Miguel"
    expect(screen.getByText('Ponta Delgada, São Miguel')).toBeInTheDocument();
  });

  // 14. Step 2: submit button
  it('step 2: renders submit button "Comecar a usar o AgroConnect"', async () => {
    renderWithProviders(<ProviderOnboarding />, { route: '/onboarding' });
    await advancePastStep0();
    await advancePastStep1();

    const submitButton = screen.getByText('Comecar a usar o AgroConnect');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton.closest('button')).not.toBeDisabled();

    // "Seguinte" should no longer be present on the last step
    expect(screen.queryByText('Seguinte')).not.toBeInTheDocument();
    // "Anterior" should be present to go back
    expect(screen.getByText('Anterior')).toBeInTheDocument();
  });
});

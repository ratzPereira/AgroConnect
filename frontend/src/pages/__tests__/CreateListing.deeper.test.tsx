import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { CreateListing } from '../CreateListing';
import { toast } from 'sonner';

/* ── Mocks ───────────────────────────────────────────────── */

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockCreateListing = vi.fn();

vi.mock('@/api/listings', () => ({
  createListing: (...args: unknown[]) => mockCreateListing(...args),
  getListingUploadUrl: vi.fn(),
  confirmListingPhoto: vi.fn(),
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/features/requests/components/LocationPicker', () => ({
  LocationPicker: () => <div data-testid="location-picker">LocationPicker</div>,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

/* ── Helpers ──────────────────────────────────────────────── */

function renderPage() {
  return renderWithProviders(<CreateListing />, { route: '/marketplace/new' });
}

/* ── Tests ────────────────────────────────────────────────── */

describe('CreateListing — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateListing.mockResolvedValue({ id: 42 });
  });

  // 1. Page title
  it('renders page title "Novo Anuncio"', () => {
    renderPage();
    expect(screen.getByText('Novo Anúncio')).toBeInTheDocument();
  });

  // 2. Back link to marketplace
  it('renders "Voltar ao Marketplace" back link', () => {
    renderPage();
    expect(screen.getByText('Voltar ao Marketplace')).toBeInTheDocument();
  });

  // 3. All 5 category options with labels
  it('renders all 5 category options with their labels', () => {
    renderPage();
    expect(screen.getByText('Animais')).toBeInTheDocument();
    expect(screen.getByText('Plantas')).toBeInTheDocument();
    expect(screen.getByText('Sementes')).toBeInTheDocument();
    expect(screen.getByText('Produção')).toBeInTheDocument();
    expect(screen.getByText('Equipamento')).toBeInTheDocument();

    // Check descriptions too
    expect(screen.getByText('Gado, aves, animais de quinta')).toBeInTheDocument();
    expect(screen.getByText('Máquinas, ferramentas, peças')).toBeInTheDocument();
  });

  // 4. Title and description inputs
  it('renders title and description input fields', () => {
    renderPage();
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ex: Vitelos Holstein de 6 meses')).toBeInTheDocument();
    expect(screen.getByLabelText('Descrição')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Descreva o que está a vender/)).toBeInTheDocument();
  });

  // 5. Price input visible when priceConsulta is unchecked (default)
  it('renders price input visible by default (priceConsulta unchecked)', () => {
    renderPage();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
  });

  // 6. Prego sob consulta checkbox
  it('renders priceConsulta checkbox labeled "Preco sob consulta"', () => {
    renderPage();
    expect(screen.getByText('Preço sob consulta')).toBeInTheDocument();
  });

  // 7. Location section with cascading dropdowns
  it('renders location section with island, municipality, and parish dropdowns', () => {
    renderPage();
    expect(screen.getByLabelText('Ilha *')).toBeInTheDocument();
    expect(screen.getByLabelText('Município *')).toBeInTheDocument();
    expect(screen.getByLabelText('Freguesia')).toBeInTheDocument();
    expect(screen.getByTestId('location-picker')).toBeInTheDocument();
  });

  // 8. Photo section with drop zone
  it('renders photo section with drop zone and upload instructions', () => {
    renderPage();
    expect(screen.getByText('Fotografias')).toBeInTheDocument();
    expect(screen.getByText(/Adicione até 8 fotos/)).toBeInTheDocument();
    expect(screen.getByText(/Arraste imagens ou/)).toBeInTheDocument();
    expect(screen.getByText(/JPEG, PNG ou WebP/)).toBeInTheDocument();
  });

  // 9. Photo count "0/8 fotos"
  it('shows initial photo count as "0/8 fotos"', () => {
    renderPage();
    expect(screen.getByText('0/8 fotos')).toBeInTheDocument();
  });

  // 10. Submit button "Publicar Anuncio"
  it('renders submit button "Publicar Anuncio"', () => {
    renderPage();
    expect(screen.getByText('Publicar Anúncio')).toBeInTheDocument();
  });

  // 11. Error on mutation failure
  it('shows error message when create mutation fails', async () => {
    mockCreateListing.mockRejectedValue(new Error('Server error'));

    renderPage();

    const user = userEvent.setup();

    // Fill minimum required fields to pass zod validation before submit fires the mutation
    // Select a category
    const animaisLabel = screen.getByText('Animais').closest('label');
    if (animaisLabel) await user.click(animaisLabel);

    // Fill title (min 5 chars)
    const titleInput = screen.getByLabelText('Título');
    await user.type(titleInput, 'Vitelos para venda');

    // Fill description (min 20 chars)
    const descInput = screen.getByLabelText('Descrição');
    await user.type(descInput, 'Vitelos Holstein de 6 meses em bom estado de saude');

    // Fill location
    const islandSelect = screen.getByLabelText('Ilha *');
    fireEvent.change(islandSelect, { target: { value: 'São Miguel' } });
    const muniSelect = screen.getByLabelText('Município *');
    fireEvent.change(muniSelect, { target: { value: 'Ponta Delgada' } });

    // Submit the form
    const submitBtn = screen.getByText('Publicar Anúncio');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao criar o anúncio. Tente novamente.');
    });
  });

  // 12. File type validation triggers toast.error for invalid type
  it('shows toast error when adding a file with invalid type', () => {
    renderPage();

    // The hidden file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    // Create a non-image file (txt)
    const invalidFile = new File(['contents'], 'document.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(toast.error).toHaveBeenCalledWith(
      'Formato não suportado. Use JPEG, PNG ou WebP.',
    );
  });
});

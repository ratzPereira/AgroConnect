import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { CreateRequest } from '../CreateRequest';

/* ── Mocks ───────────────────────────────────────────────── */

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockCreateRequest = vi.fn();
const mockPublishRequest = vi.fn();

vi.mock('@/api/requests', () => ({
  createRequest: (...args: unknown[]) => mockCreateRequest(...args),
  publishRequest: (...args: unknown[]) => mockPublishRequest(...args),
  getUploadUrl: vi.fn(),
  confirmPhoto: vi.fn(),
}));

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(() =>
      Promise.resolve({
        data: [
          {
            id: 1,
            name: 'Lavoura',
            slug: 'lavoura',
            description: 'Serviço de lavoura de terrenos.',
            formSchema: null,
          },
          {
            id: 2,
            name: 'Pulverização',
            slug: 'pulverizacao',
            description: 'Serviço de pulverização.',
            formSchema: JSON.stringify({
              fields: [
                { name: 'product', label: 'Produto', type: 'text', required: true },
              ],
            }),
          },
          {
            id: 3,
            name: 'Jardinagem',
            slug: 'jardinagem',
            description: 'Manutenção de jardins.',
            formSchema: null,
          },
        ],
      }),
    ),
  },
}));

vi.mock('@/features/requests/components/LocationPicker', () => ({
  LocationPicker: () => <div data-testid="location-picker">LocationPicker</div>,
}));

vi.mock('@/features/requests/components/DynamicForm', () => ({
  DynamicForm: ({ schema }: { schema: { fields: Array<{ name: string; label: string }> } }) => (
    <div data-testid="dynamic-form">
      {schema.fields.map((f) => (
        <span key={f.name}>{f.label}</span>
      ))}
    </div>
  ),
}));

vi.mock('@/features/requests/components/WizardPhotoCollector', () => ({
  WizardPhotoCollector: ({ files }: { files: File[] }) => (
    <div data-testid="photo-collector">Photos: {files.length}</div>
  ),
}));

/* ── Helpers ──────────────────────────────────────────────── */

function renderPage() {
  return renderWithProviders(<CreateRequest />, { route: '/requests/new' });
}

/** Wait for categories to load, select a category, and click Seguinte. */
async function goToStep(targetStep: number) {
  const user = userEvent.setup();
  renderPage();

  // Wait for categories to load from the mock API
  await waitFor(() => {
    expect(screen.getByText('Lavoura')).toBeInTheDocument();
  });

  if (targetStep === 0) return;

  // Step 0 → 1: select a category then click Seguinte
  const categoryLabel = screen.getByText('Lavoura').closest('label');
  if (categoryLabel) await user.click(categoryLabel);
  await user.click(screen.getByText('Seguinte'));
  await waitFor(() => {
    expect(screen.getByText('Detalhes do pedido')).toBeInTheDocument();
  });

  if (targetStep === 1) return;

  // Step 1 → 2: fill required fields (title, description)
  const titleInput = screen.getByPlaceholderText(/Lavoura de terreno/);
  const descTextarea = screen.getByPlaceholderText(/Descreva o que precisa/);
  await user.type(titleInput, 'Teste de lavoura');
  await user.type(descTextarea, 'Preciso de lavoura de 2 hectares');
  await user.click(screen.getByText('Seguinte'));
  await waitFor(() => {
    expect(screen.getByLabelText('Ilha *')).toBeInTheDocument();
  });

  if (targetStep === 2) return;

  // Step 2 → 3: select island + municipality (mandatory), set coords via select
  const islandSelect = screen.getByLabelText('Ilha *');
  fireEvent.change(islandSelect, { target: { value: 'São Miguel' } });
  const muniSelect = screen.getByLabelText('Município *');
  fireEvent.change(muniSelect, { target: { value: 'Ponta Delgada' } });
  await user.click(screen.getByText('Seguinte'));
  await waitFor(() => {
    expect(screen.getByTestId('photo-collector')).toBeInTheDocument();
  });

  if (targetStep === 3) return;

  // Step 3 → 4: just click Seguinte (photos are optional)
  await user.click(screen.getByText('Seguinte'));
  await waitFor(() => {
    expect(screen.getByText('Publicar Pedido')).toBeInTheDocument();
  });
}

/* ── Tests ────────────────────────────────────────────────── */

describe('CreateRequest — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateRequest.mockResolvedValue({ id: 99 });
    mockPublishRequest.mockResolvedValue({ id: 99 });
  });

  // 1. Step indicator with 5 steps
  it('renders step indicator with all 5 step labels', () => {
    renderPage();
    expect(screen.getByText('Categoria')).toBeInTheDocument();
    expect(screen.getByText('Detalhes')).toBeInTheDocument();
    expect(screen.getByText('Localização')).toBeInTheDocument();
    expect(screen.getByText('Fotografias')).toBeInTheDocument();
    expect(screen.getByText('Revisão')).toBeInTheDocument();
  });

  // 2. Category selection on step 0
  it('shows category selection with loaded categories on step 0', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Lavoura')).toBeInTheDocument();
    });
    expect(screen.getByText('Pulverização')).toBeInTheDocument();
    expect(screen.getByText('Jardinagem')).toBeInTheDocument();
    expect(screen.getByText('Selecione a categoria')).toBeInTheDocument();
  });

  // 3. "Voltar aos pedidos" link on step 0
  it('shows "Voltar aos pedidos" back link on step 0', () => {
    renderPage();
    expect(screen.getByText('Voltar aos pedidos')).toBeInTheDocument();
  });

  // 4. "Voltar" button on subsequent steps
  it('shows "Voltar" back button on steps after step 0', async () => {
    await goToStep(1);
    expect(screen.getByText('Voltar')).toBeInTheDocument();
    expect(screen.queryByText('Voltar aos pedidos')).not.toBeInTheDocument();
  });

  // 5. Title and description fields on step 1
  it('renders title and description fields on step 1', async () => {
    await goToStep(1);
    expect(screen.getByPlaceholderText(/Lavoura de terreno/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Descreva o que precisa/)).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByLabelText('Descrição')).toBeInTheDocument();
  });

  // 6. Urgency select with 3 options on step 1
  it('renders urgency select with Baixa, Média, Alta options on step 1', async () => {
    await goToStep(1);
    const urgencySelect = screen.getByLabelText('Urgência');
    expect(urgencySelect).toBeInTheDocument();

    const options = urgencySelect.querySelectorAll('option');
    expect(options).toHaveLength(3);

    const optionTexts = Array.from(options).map((o) => o.textContent);
    expect(optionTexts).toContain('Baixa');
    expect(optionTexts).toContain('Média');
    expect(optionTexts).toContain('Alta');
  });

  // 7. Location dropdowns on step 2
  it('renders island, municipality, and parish dropdowns on step 2', async () => {
    await goToStep(2);
    expect(screen.getByLabelText('Ilha *')).toBeInTheDocument();
    expect(screen.getByLabelText('Município *')).toBeInTheDocument();
    expect(screen.getByLabelText('Freguesia')).toBeInTheDocument();
    expect(screen.getByTestId('location-picker')).toBeInTheDocument();
  });

  // 8. WizardPhotoCollector on step 3
  it('renders WizardPhotoCollector on step 3', async () => {
    await goToStep(3);
    expect(screen.getByTestId('photo-collector')).toBeInTheDocument();
    expect(screen.getByText(/Photos:/)).toBeInTheDocument();
  });

  // 9. Review summary on step 4
  it('renders review summary with category, urgency, title, description on step 4', async () => {
    await goToStep(4);

    // Summary labels appear in the review grid (step indicator also has some of these texts)
    // Use getAllByText for texts that appear in both step indicator and review grid
    const categoriaElements = screen.getAllByText('Categoria');
    expect(categoriaElements.length).toBeGreaterThanOrEqual(2); // step indicator + review
    expect(screen.getByText('Urgência')).toBeInTheDocument();
    expect(screen.getByText('Título')).toBeInTheDocument();
    expect(screen.getByText('Descrição')).toBeInTheDocument();

    // Check that actual review values are shown
    expect(screen.getByText('Lavoura')).toBeInTheDocument(); // category name
    expect(screen.getByText('Média')).toBeInTheDocument(); // urgency default
    expect(screen.getByText('Teste de lavoura')).toBeInTheDocument(); // title value
    expect(screen.getByText('Preciso de lavoura de 2 hectares')).toBeInTheDocument(); // description value
  });

  // 10. "Publicar Pedido" button on last step
  it('shows "Publicar Pedido" submit button on the review step', async () => {
    await goToStep(4);
    expect(screen.getByText('Publicar Pedido')).toBeInTheDocument();
    // Seguinte should NOT be visible on the last step
    expect(screen.queryByText('Seguinte')).not.toBeInTheDocument();
  });

  // 11. Error message when mutation fails
  it('shows error message when create mutation fails', async () => {
    mockCreateRequest.mockRejectedValue(new Error('Server error'));

    await goToStep(4);

    const user = userEvent.setup();
    await user.click(screen.getByText('Publicar Pedido'));

    await waitFor(() => {
      expect(
        screen.getByText('Ocorreu um erro ao criar o pedido. Tente novamente.'),
      ).toBeInTheDocument();
    });
  });

  // 12. Photo count on review when photos exist
  it('shows page title "Novo Pedido de Serviço"', () => {
    renderPage();
    expect(
      screen.getByText('Novo Pedido de Serviço'),
    ).toBeInTheDocument();
  });
});

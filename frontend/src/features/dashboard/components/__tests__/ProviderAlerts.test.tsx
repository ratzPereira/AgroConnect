import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProviderAlerts } from '../ProviderAlerts';
import type { InventoryItem } from '@/types/inventory';
import type { Machine } from '@/types/machine';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [k: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

vi.mock('@/components/ui/Alert', () => ({
  Alert: ({ variant, title, children }: { variant?: string; title?: string; children: React.ReactNode }) => (
    <div data-testid={`alert-${variant}`} role="alert">
      {title && <strong>{title}</strong>}
      <span>{children}</span>
    </div>
  ),
}));

const makeLowStockItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
  id: 1,
  productName: 'Adubo NPK',
  unit: 'KG',
  quantity: 5,
  minStockAlert: 20,
  costPerUnit: 1.5,
  lowStock: true,
  createdAt: '2026-03-01T10:00:00Z',
  updatedAt: '2026-03-01T10:00:00Z',
  ...overrides,
});

const makeMaintenanceMachine = (overrides: Partial<Machine> = {}): Machine => ({
  id: 1,
  name: 'Trator John Deere',
  type: 'Trator',
  description: null,
  status: 'MAINTENANCE',
  licensePlate: 'AB-12-CD',
  lastMaintenanceDate: '2025-12-01',
  nextMaintenanceDate: '2026-03-01',
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

describe('ProviderAlerts', () => {
  it('returns null when no alerts', () => {
    const { container } = render(
      <ProviderAlerts lowStockItems={[]} maintenanceDueMachines={[]} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows low stock warning for single item', () => {
    const item = makeLowStockItem();
    render(<ProviderAlerts lowStockItems={[item]} maintenanceDueMachines={[]} />);
    expect(screen.getByText('Stock baixo')).toBeInTheDocument();
    expect(screen.getByText(/Adubo NPK está abaixo do nível mínimo/)).toBeInTheDocument();
  });

  it('shows low stock warning for multiple items', () => {
    const items = [
      makeLowStockItem({ id: 1, productName: 'Adubo NPK' }),
      makeLowStockItem({ id: 2, productName: 'Herbicida' }),
    ];
    render(<ProviderAlerts lowStockItems={items} maintenanceDueMachines={[]} />);
    expect(screen.getByText(/2 itens estão abaixo do nível mínimo/)).toBeInTheDocument();
  });

  it('shows maintenance alert for single machine', () => {
    const machine = makeMaintenanceMachine();
    render(<ProviderAlerts lowStockItems={[]} maintenanceDueMachines={[machine]} />);
    expect(screen.getByText('Manutenção pendente')).toBeInTheDocument();
    expect(screen.getByText(/Trator John Deere precisa de manutenção/)).toBeInTheDocument();
  });

  it('shows both alerts when applicable', () => {
    const item = makeLowStockItem();
    const machine = makeMaintenanceMachine();
    render(<ProviderAlerts lowStockItems={[item]} maintenanceDueMachines={[machine]} />);
    expect(screen.getByText('Stock baixo')).toBeInTheDocument();
    expect(screen.getByText('Manutenção pendente')).toBeInTheDocument();
    expect(screen.getByTestId('alert-warning')).toBeInTheDocument();
    expect(screen.getByTestId('alert-danger')).toBeInTheDocument();
  });

  it('renders inventory link', () => {
    const item = makeLowStockItem();
    render(<ProviderAlerts lowStockItems={[item]} maintenanceDueMachines={[]} />);
    const link = screen.getByText('Ver inventário');
    expect(link.closest('a')).toHaveAttribute('href', '/provider/inventory');
  });

  it('renders machines link', () => {
    const machine = makeMaintenanceMachine();
    render(<ProviderAlerts lowStockItems={[]} maintenanceDueMachines={[machine]} />);
    const link = screen.getByText('Ver máquinas');
    expect(link.closest('a')).toHaveAttribute('href', '/provider/machines');
  });
});

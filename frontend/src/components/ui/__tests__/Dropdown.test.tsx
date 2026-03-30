import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode, HTMLAttributes } from 'react';
import { Dropdown } from '../Dropdown';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    },
  };
});

const defaultItems = [
  { id: 'edit', label: 'Editar', onClick: vi.fn() },
  { id: 'delete', label: 'Eliminar', danger: true, onClick: vi.fn() },
];

describe('Dropdown', () => {
  it('renders trigger element', () => {
    render(
      <Dropdown trigger={<button>Menu</button>} items={defaultItems} />,
    );
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('does not show options initially', () => {
    render(
      <Dropdown trigger={<button>Menu</button>} items={defaultItems} />,
    );
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
  });

  it('shows options on trigger click', () => {
    render(
      <Dropdown trigger={<button>Menu</button>} items={defaultItems} />,
    );
    fireEvent.click(screen.getByText('Menu'));
    expect(screen.getByText('Editar')).toBeInTheDocument();
    expect(screen.getByText('Eliminar')).toBeInTheDocument();
  });

  it('calls item onClick and closes dropdown when item clicked', () => {
    const onEdit = vi.fn();
    const items = [
      { id: 'edit', label: 'Editar', onClick: onEdit },
    ];
    render(
      <Dropdown trigger={<button>Menu</button>} items={items} />,
    );
    fireEvent.click(screen.getByText('Menu'));
    fireEvent.click(screen.getByText('Editar'));
    expect(onEdit).toHaveBeenCalledOnce();
    // Dropdown should close after click
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
  });

  it('renders divider items', () => {
    const items = [
      { id: 'edit', label: 'Editar', onClick: vi.fn() },
      { id: 'divider', label: '', divider: true },
      { id: 'delete', label: 'Eliminar', danger: true, onClick: vi.fn() },
    ];
    render(
      <Dropdown trigger={<button>Menu</button>} items={items} />,
    );
    fireEvent.click(screen.getByText('Menu'));
    expect(screen.getByText('Editar')).toBeInTheDocument();
    expect(screen.getByText('Eliminar')).toBeInTheDocument();
  });

  it('applies danger styling to danger items', () => {
    render(
      <Dropdown trigger={<button>Menu</button>} items={defaultItems} />,
    );
    fireEvent.click(screen.getByText('Menu'));
    const deleteBtn = screen.getByText('Eliminar').closest('button') as HTMLElement;
    expect(deleteBtn.className).toContain('text-danger-600');
  });
});

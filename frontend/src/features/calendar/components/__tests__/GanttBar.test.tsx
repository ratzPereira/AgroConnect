import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GanttBarComponent } from '../GanttBar';
import type { GanttBar } from '@/types/calendar';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockBar: GanttBar = {
  executionId: 1,
  requestId: 10,
  requestTitle: 'Lavoura de terreno',
  categoryName: 'Preparação de Solo',
  startDate: '2026-03-10',
  endDate: '2026-03-12',
  urgency: 'MEDIUM',
  status: 'IN_PROGRESS',
  island: 'Terceira',
  parish: 'Angra do Heroísmo',
  hasConflict: false,
};

describe('GanttBarComponent', () => {
  const defaultProps = {
    bar: mockBar,
    left: 25,
    width: 10,
    rowIndex: 0,
    subIndex: 0,
  };

  function renderBar(props = {}) {
    return render(
      <MemoryRouter>
        <GanttBarComponent {...defaultProps} {...props} />
      </MemoryRouter>,
    );
  }

  it('renders bar element with correct title text', () => {
    renderBar();
    expect(screen.getByText('Lavoura de terreno')).toBeInTheDocument();
  });

  it('renders as a button role', () => {
    renderBar();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applies conflict ring styling when hasConflict is true', () => {
    renderBar({ bar: { ...mockBar, hasConflict: true } });
    const button = screen.getByRole('button');
    expect(button.className).toContain('ring-2');
  });

  it('does not apply conflict ring styling when hasConflict is false', () => {
    renderBar();
    const button = screen.getByRole('button');
    expect(button.className).not.toContain('ring-2');
  });
});

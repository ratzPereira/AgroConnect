import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { MonthView } from '../MonthView';

function wrap(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('MonthView (grid)', () => {
  it('shows empty state when no events', () => {
    wrap(
      <MonthView
        events={[]}
        conflicts={[]}
        year={2026}
        month={4}
        lane="operators"
        emptyState={<div>Vazio</div>}
      />,
    );
    expect(screen.getByText('Vazio')).toBeInTheDocument();
  });

  it('renders MonthGrid headers when no empty state is provided', () => {
    wrap(<MonthView events={[]} conflicts={[]} year={2026} month={4} lane="operators" />);
    expect(screen.getByText('Dom')).toBeInTheDocument();
  });
});

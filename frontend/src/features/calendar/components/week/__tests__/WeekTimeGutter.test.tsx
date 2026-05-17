import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeekTimeGutter } from '../WeekTimeGutter';

describe('WeekTimeGutter', () => {
  it('renders hour labels from 06:00 to 20:00', () => {
    render(<WeekTimeGutter />);
    expect(screen.getByText('06:00')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getByText('20:00')).toBeInTheDocument();
  });

  it('does NOT render labels for hours outside the working range', () => {
    render(<WeekTimeGutter />);
    expect(screen.queryByText('05:00')).not.toBeInTheDocument();
    expect(screen.queryByText('21:00')).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RootLayout } from '../RootLayout';

vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));

vi.mock('@/components/CookieBanner', () => ({
  CookieBanner: () => <div data-testid="cookie-banner">Cookie Banner</div>,
}));

describe('RootLayout', () => {
  it('renders Outlet content', () => {
    render(<RootLayout />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByText('Outlet Content')).toBeInTheDocument();
  });

  it('renders CookieBanner', () => {
    render(<RootLayout />);
    expect(screen.getByTestId('cookie-banner')).toBeInTheDocument();
    expect(screen.getByText('Cookie Banner')).toBeInTheDocument();
  });
});

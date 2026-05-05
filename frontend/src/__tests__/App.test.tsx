import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

/* ── Mocks ───────────────────────────────────────────────── */

vi.mock('@/routes', () => ({
  router: {},
}));

vi.mock('react-router-dom', () => ({
  RouterProvider: () => <div data-testid="router-provider">Router</div>,
}));

vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

/* ── Tests ───────────────────────────────────────────────── */

describe('App', () => {
  it('renders without crashing', async () => {
    const { App } = await import('../App');
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('includes QueryClientProvider, ErrorBoundary, RouterProvider, and Toaster', async () => {
    const { App } = await import('../App');
    render(<App />);

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('router-provider')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  it('wraps RouterProvider inside ErrorBoundary', async () => {
    const { App } = await import('../App');
    render(<App />);

    const errorBoundary = screen.getByTestId('error-boundary');
    const routerProvider = screen.getByTestId('router-provider');
    // RouterProvider should be a descendant of ErrorBoundary
    expect(errorBoundary).toContainElement(routerProvider);
  });
});

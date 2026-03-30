import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock the ErrorIllustration to simplify rendering
vi.mock('@/components/illustrations/ErrorIllustration', () => ({
  ErrorIllustration: ({ className }: { className?: string }) => (
    <div data-testid="error-illustration" className={className} />
  ),
}));

// Suppress console.error during expected error boundary triggers
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  cleanup();
  console.error = originalConsoleError;
});

function ThrowingComponent({ message = 'Test error' }: { message?: string }): never {
  throw new Error(message);
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>Hello World</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Hello World')).toBeDefined();
  });

  it('shows error UI when a child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Algo correu mal')).toBeDefined();
    expect(screen.getByText(/Ocorreu um erro inesperado/)).toBeDefined();
    expect(screen.getByText('Tentar novamente')).toBeDefined();
  });

  it('shows the ErrorIllustration in error state', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error-illustration')).toBeDefined();
  });

  it('resets error state and re-renders children on retry button click', () => {
    let shouldThrow = true;
    function MaybeThrow() {
      if (shouldThrow) throw new Error('Temporary error');
      return <p>Recovered successfully</p>;
    }

    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Algo correu mal')).toBeDefined();

    // Fix the condition and click retry
    shouldThrow = false;
    fireEvent.click(screen.getByText('Tentar novamente'));

    expect(screen.getByText('Recovered successfully')).toBeDefined();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error page</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom error page')).toBeDefined();
    // Default error UI should not render
    expect(screen.queryByText('Algo correu mal')).toBeNull();
    expect(screen.queryByText('Tentar novamente')).toBeNull();
  });

  it('calls console.error via componentDidCatch when error is caught', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Caught error" />
      </ErrorBoundary>,
    );

    // console.error is mocked — verify it was called with the error
    expect(console.error).toHaveBeenCalled();
    const calls = vi.mocked(console.error).mock.calls;
    const catchCall = calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('ErrorBoundary caught:'),
    );
    expect(catchCall).toBeDefined();
  });

  it('shows error details in DEV mode', () => {
    // Vitest runs with import.meta.env.DEV = true by default
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Detailed error info" />
      </ErrorBoundary>,
    );

    // The details/summary element should be present in DEV mode
    expect(screen.getByText('Detalhes do erro (dev)')).toBeDefined();
    expect(screen.getByText(/Detailed error info/)).toBeDefined();
  });

  it('does not render error UI for normal children after recovery', () => {
    let shouldThrow = true;
    function MaybeThrow() {
      if (shouldThrow) throw new Error('Error');
      return <p>All good</p>;
    }

    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>,
    );

    // In error state
    expect(screen.getByText('Algo correu mal')).toBeDefined();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Tentar novamente'));

    // After recovery — error UI should be gone
    expect(screen.queryByText('Algo correu mal')).toBeNull();
    expect(screen.getByText('All good')).toBeDefined();
  });
});

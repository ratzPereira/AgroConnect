import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Suppress console.error during expected errors
const consoleError = console.error;
beforeEach(() => { console.error = vi.fn(); });
afterEach(() => {
  cleanup();
  console.error = consoleError;
});

function ThrowingComponent(): never {
  throw new Error('Test error');
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <p>Hello</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Hello')).toBeDefined();
  });

  it('shows error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Algo correu mal')).toBeDefined();
    expect(screen.getByText('Tentar novamente')).toBeDefined();
  });

  it('resets on retry click', () => {
    let shouldThrow = true;
    function MaybeThrow() {
      if (shouldThrow) throw new Error('Test error');
      return <p>Recovered</p>;
    }

    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Algo correu mal')).toBeDefined();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Tentar novamente'));

    expect(screen.getByText('Recovered')).toBeDefined();
  });
});

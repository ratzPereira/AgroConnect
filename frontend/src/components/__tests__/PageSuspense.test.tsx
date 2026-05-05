import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PageSuspense } from '../PageSuspense';

describe('PageSuspense', () => {
  it('renders children when loaded', () => {
    render(
      <PageSuspense>
        <div>Loaded content</div>
      </PageSuspense>,
    );

    expect(screen.getByText('Loaded content')).toBeInTheDocument();
  });

  it('shows fallback during loading', () => {
    const LazyComponent = React.lazy(
      () => new Promise<{ default: React.ComponentType }>(() => {
        // Never resolves, so Suspense shows fallback
      }),
    );

    const { container } = render(
      <PageSuspense>
        <LazyComponent />
      </PageSuspense>,
    );

    // The fallback contains a Loader2 spinner with animate-spin class
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
  });
});

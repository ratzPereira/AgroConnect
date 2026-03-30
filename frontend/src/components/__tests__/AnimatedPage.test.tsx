import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div data-testid="motion-div" {...props}>
        {children as React.ReactNode}
      </div>
    ),
  },
  useReducedMotion: () => false,
}));

vi.mock('@/hooks/useMotionConfig', () => ({
  useMotionConfig: () => ({
    pageVariants: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
    pageTransition: { type: 'tween', duration: 0.2 },
    shouldAnimate: true,
  }),
}));

import { AnimatedPage } from '../AnimatedPage';

describe('AnimatedPage', () => {
  it('renders children', () => {
    render(
      <AnimatedPage>
        <p>Page content</p>
      </AnimatedPage>,
    );

    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('wraps children in a motion div', () => {
    render(
      <AnimatedPage>
        <p>Wrapped content</p>
      </AnimatedPage>,
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toBeInTheDocument();
    expect(motionDiv).toContainElement(screen.getByText('Wrapped content'));
  });

  it('applies className to the wrapper', () => {
    render(
      <AnimatedPage className="custom-class">
        <p>Styled content</p>
      </AnimatedPage>,
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveClass('custom-class');
  });
});

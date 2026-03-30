import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EmptyRequests } from '../EmptyRequests';
import { EmptyNotifications } from '../EmptyNotifications';
import { EmptyTransactions } from '../EmptyTransactions';
import { EmptyTeam } from '../EmptyTeam';
import { ErrorIllustration } from '../ErrorIllustration';
import { EmptyProposals } from '../EmptyProposals';
import { LandingHero } from '../LandingHero';

describe('Illustration components', () => {
  it('EmptyRequests renders SVG content', () => {
    const { container } = render(<EmptyRequests />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.children.length).toBeGreaterThan(0);
  });

  it('EmptyNotifications renders SVG content', () => {
    const { container } = render(<EmptyNotifications />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.children.length).toBeGreaterThan(0);
  });

  it('EmptyTransactions renders SVG content', () => {
    const { container } = render(<EmptyTransactions />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.children.length).toBeGreaterThan(0);
  });

  it('EmptyTeam renders SVG content', () => {
    const { container } = render(<EmptyTeam />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.children.length).toBeGreaterThan(0);
  });

  it('ErrorIllustration renders SVG content', () => {
    const { container } = render(<ErrorIllustration />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.children.length).toBeGreaterThan(0);
  });

  it('EmptyProposals renders SVG content', () => {
    const { container } = render(<EmptyProposals />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.children.length).toBeGreaterThan(0);
  });

  it('LandingHero renders SVG content', () => {
    const { container } = render(<LandingHero />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.children.length).toBeGreaterThan(0);
  });

  it('illustration components accept className prop', () => {
    const { container } = render(<EmptyRequests className="w-48 h-48" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('w-48');
    expect(svg?.getAttribute('class')).toContain('h-48');
  });
});

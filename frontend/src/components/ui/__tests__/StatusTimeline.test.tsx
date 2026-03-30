import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusTimeline } from '../StatusTimeline';

const steps = [
  { label: 'Pedido criado', status: 'completed' as const, timestamp: '01/03/2026' },
  { label: 'Propostas recebidas', status: 'completed' as const },
  { label: 'Em execução', status: 'active' as const, description: 'O prestador está a trabalhar' },
  { label: 'Concluído', status: 'upcoming' as const },
];

describe('StatusTimeline', () => {
  it('renders all timeline steps', () => {
    render(<StatusTimeline steps={steps} />);
    expect(screen.getByText('Pedido criado')).toBeInTheDocument();
    expect(screen.getByText('Propostas recebidas')).toBeInTheDocument();
    expect(screen.getByText('Em execução')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });

  it('marks completed steps with checkmark icon', () => {
    const { container } = render(<StatusTimeline steps={steps} />);
    // Each completed step has a bg-leaf-500 circle AND a bg-leaf-500 connector line
    // 2 completed steps = 2 circles + 2 connector lines = 4 total bg-leaf-500 elements
    const completedElements = container.querySelectorAll('.bg-leaf-500');
    expect(completedElements.length).toBe(4);
  });

  it('marks active step with pulse animation', () => {
    const { container } = render(<StatusTimeline steps={steps} />);
    const pulsingDot = container.querySelector('.animate-pulse');
    expect(pulsingDot).not.toBeNull();
  });

  it('renders timestamps when provided', () => {
    render(<StatusTimeline steps={steps} />);
    expect(screen.getByText('01/03/2026')).toBeInTheDocument();
  });

  it('renders descriptions when provided', () => {
    render(<StatusTimeline steps={steps} />);
    expect(screen.getByText('O prestador está a trabalhar')).toBeInTheDocument();
  });

  it('applies muted text color to upcoming steps', () => {
    render(<StatusTimeline steps={steps} />);
    const upcomingLabel = screen.getByText('Concluído');
    expect(upcomingLabel.className).toContain('text-neutral-400');
  });
});

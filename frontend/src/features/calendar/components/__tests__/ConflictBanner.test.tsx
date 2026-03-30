import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConflictBanner } from '../ConflictBanner';
import type { ConflictResponse } from '@/types/calendar';

vi.mock('lucide-react', () => ({
  AlertTriangle: (props: Record<string, unknown>) => <svg data-testid="icon-alert-triangle" {...props} />,
}));

const makeConflict = (overrides: Partial<ConflictResponse> = {}): ConflictResponse => ({
  resourceType: 'TEAM_MEMBER',
  resourceId: 1,
  resourceName: 'João Silva',
  date: '2026-04-01',
  conflictingEvents: [
    { executionId: 1, requestTitle: 'Lavoura' },
    { executionId: 2, requestTitle: 'Limpeza' },
  ],
  ...overrides,
});

describe('ConflictBanner', () => {
  it('returns null when no conflicts', () => {
    const { container } = render(<ConflictBanner conflicts={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows single conflict message', () => {
    const conflicts = [makeConflict()];
    render(<ConflictBanner conflicts={conflicts} />);
    expect(screen.getByText(/1 conflito detetado/)).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('shows plural conflicts message', () => {
    const conflicts = [
      makeConflict({ resourceId: 1, resourceName: 'João Silva' }),
      makeConflict({ resourceId: 2, resourceName: 'Ana Costa', resourceType: 'MACHINE' }),
    ];
    render(<ConflictBanner conflicts={conflicts} />);
    expect(screen.getByText(/2 conflitos detetados/)).toBeInTheDocument();
  });

  it('shows "+N conflitos adicionais" when more than 5', () => {
    const conflicts = Array.from({ length: 7 }, (_, i) =>
      makeConflict({
        resourceId: i + 1,
        resourceName: `Recurso ${i + 1}`,
      }),
    );
    render(<ConflictBanner conflicts={conflicts} />);
    expect(screen.getByText('+2 conflitos adicionais')).toBeInTheDocument();
  });

  it('shows resource type label for team member', () => {
    const conflicts = [makeConflict({ resourceType: 'TEAM_MEMBER' })];
    render(<ConflictBanner conflicts={conflicts} />);
    expect(screen.getByText(/Membro/)).toBeInTheDocument();
  });

  it('shows resource type label for machine', () => {
    const conflicts = [makeConflict({ resourceType: 'MACHINE', resourceName: 'Trator A' })];
    render(<ConflictBanner conflicts={conflicts} />);
    expect(screen.getByText(/Máquina/)).toBeInTheDocument();
  });

  it('shows conflicting event titles separated by slash', () => {
    const conflicts = [makeConflict()];
    render(<ConflictBanner conflicts={conflicts} />);
    expect(screen.getByText(/Lavoura \/ Limpeza/)).toBeInTheDocument();
  });
});

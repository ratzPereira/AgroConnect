import { describe, it, expect } from 'vitest';
import { getEventVisualStyle, STATUS_VISUAL } from '../eventStyles';
import type { CalendarEvent } from '@/types/calendar';
import type { RequestStatus } from '@/types/request';

function evt(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    executionId: 1,
    requestId: 10,
    requestTitle: 'Test Job',
    categoryName: 'Lavoura',
    scheduledDate: '2026-05-17',
    scheduledEndDate: '2026-05-17',
    scheduledStartTime: '08:00',
    scheduledEndTime: '12:00',
    scheduledAllDay: false,
    urgency: 'MEDIUM',
    status: 'AWARDED',
    island: 'Terceira',
    parish: 'Sé',
    assignments: [],
    ...overrides,
  };
}

describe('eventStyles', () => {
  describe('STATUS_VISUAL.bar', () => {
    it('maps each status to a distinct Tailwind bar class', () => {
      expect(STATUS_VISUAL.AWARDED.bar).toContain('bg-sky');
      expect(STATUS_VISUAL.IN_PROGRESS.bar).toContain('bg-primary');
      expect(STATUS_VISUAL.AWAITING_CONFIRMATION.bar).toContain('bg-warning');
      expect(STATUS_VISUAL.COMPLETED.bar).toContain('bg-neutral-500');
      expect(STATUS_VISUAL.RATED.bar).toContain('bg-neutral-400');
      expect(STATUS_VISUAL.DISPUTED.bar).toContain('bg-danger');
      expect(STATUS_VISUAL.CANCELLED.bar).toContain('line-through');
    });
  });

  describe('STATUS_VISUAL.icon', () => {
    it('returns expected status glyphs', () => {
      expect(STATUS_VISUAL.IN_PROGRESS.icon).toBe('●');
      expect(STATUS_VISUAL.AWAITING_CONFIRMATION.icon).toBe('◐');
      expect(STATUS_VISUAL.COMPLETED.icon).toBe('✓');
      expect(STATUS_VISUAL.RATED.icon).toBe('✓');
      expect(STATUS_VISUAL.AWARDED.icon).toBe('○');
      expect(STATUS_VISUAL.CANCELLED.icon).toBe('✕');
      expect(STATUS_VISUAL.DISPUTED.icon).toBe('!');
    });
  });

  describe('getEventVisualStyle', () => {
    it('returns AWARDED + sky bar when status is AWARDED, no badges for MEDIUM urgency without conflict', () => {
      const s = getEventVisualStyle(evt({ status: 'AWARDED', urgency: 'MEDIUM' }), false);
      expect(s.barClass).toContain('bg-sky');
      expect(s.statusIcon).toBe('○');
      expect(s.urgencyBadge).toBeNull();
      expect(s.conflictBadge).toBeNull();
      expect(s.borderClass).toBe('');
    });

    it('adds underline border + conflict badge when hasConflict is true', () => {
      const s = getEventVisualStyle(evt({ status: 'IN_PROGRESS' }), true);
      expect(s.borderClass).toContain('border-b-2');
      expect(s.borderClass).toContain('border-danger-500');
      expect(s.conflictBadge).not.toBeNull();
    });

    it('adds HIGH urgency badge for HIGH urgency events', () => {
      const s = getEventVisualStyle(evt({ urgency: 'HIGH' }), false);
      expect(s.urgencyBadge).not.toBeNull();
    });

    it('returns null urgency badge for MEDIUM (default state)', () => {
      const s = getEventVisualStyle(evt({ urgency: 'MEDIUM' }), false);
      expect(s.urgencyBadge).toBeNull();
    });

    it('returns small dot badge for LOW urgency', () => {
      const s = getEventVisualStyle(evt({ urgency: 'LOW' }), false);
      expect(s.urgencyBadge).not.toBeNull();
    });

    it('falls back to neutral if status is unknown', () => {
      const s = getEventVisualStyle(evt({ status: 'UNKNOWN_STATUS' as unknown as RequestStatus }), false);
      expect(s.barClass).toContain('bg-neutral');
    });
  });
});

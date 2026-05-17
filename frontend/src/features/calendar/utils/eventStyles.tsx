import type { ReactNode } from 'react';
import { Flame, AlertTriangle } from 'lucide-react';
import type { CalendarEvent } from '@/types/calendar';
import type { RequestStatus } from '@/types/request';

export const STATUS_VISUAL = {
  AWARDED: {
    bar: 'bg-sky-500 hover:bg-sky-600 text-white',
    chip: 'bg-sky-100 text-sky-800 border-sky-300',
    icon: '○',
  },
  IN_PROGRESS: {
    bar: 'bg-primary-600 hover:bg-primary-700 text-white',
    chip: 'bg-primary-100 text-primary-800 border-primary-300',
    icon: '●',
  },
  AWAITING_CONFIRMATION: {
    bar: 'bg-warning-500 hover:bg-warning-600 text-white',
    chip: 'bg-warning-100 text-warning-800 border-warning-300',
    icon: '◐',
  },
  COMPLETED: {
    bar: 'bg-neutral-500 hover:bg-neutral-600 text-white',
    chip: 'bg-neutral-100 text-neutral-700 border-neutral-300',
    icon: '✓',
  },
  RATED: {
    bar: 'bg-neutral-400 hover:bg-neutral-500 text-white',
    chip: 'bg-neutral-100 text-neutral-600 border-neutral-300',
    icon: '✓',
  },
  DISPUTED: {
    bar: 'bg-danger-600 hover:bg-danger-700 text-white',
    chip: 'bg-danger-100 text-danger-800 border-danger-300',
    icon: '!',
  },
  CANCELLED: {
    bar: 'bg-neutral-200 hover:bg-neutral-300 text-neutral-500 line-through',
    chip: 'bg-neutral-100 text-neutral-500 border-neutral-300 line-through',
    icon: '✕',
  },
} as const satisfies Partial<Record<RequestStatus, { bar: string; chip: string; icon: string }>>;

const FALLBACK_VISUAL = {
  bar: 'bg-neutral-400 text-white',
  chip: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  icon: '·',
} as const;

export interface EventVisualStyle {
  barClass: string;
  chipClass: string;
  borderClass: string;
  statusIcon: string;
  urgencyBadge: ReactNode | null;
  conflictBadge: ReactNode | null;
}

function UrgencyBadge({ urgency }: { urgency: CalendarEvent['urgency'] }) {
  if (urgency === 'HIGH') {
    return (
      <span
        className="inline-flex items-center gap-0.5 rounded-sm bg-danger-100 px-1 py-0.5 text-[9px] font-bold uppercase text-danger-700"
        title="Urgência alta"
        aria-label="Urgência alta"
      >
        <Flame className="h-2.5 w-2.5" />
      </span>
    );
  }
  if (urgency === 'LOW') {
    return (
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-300"
        title="Urgência baixa"
        aria-label="Urgência baixa"
      />
    );
  }
  return null;
}

function ConflictBadge() {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-sm bg-warning-100 px-1 py-0.5 text-[9px] font-bold text-warning-800"
      title="Conflito de recurso"
      aria-label="Conflito de recurso"
    >
      <AlertTriangle className="h-2.5 w-2.5" />
    </span>
  );
}

export function getEventVisualStyle(event: CalendarEvent, hasConflict: boolean): EventVisualStyle {
  const visual = STATUS_VISUAL[event.status as keyof typeof STATUS_VISUAL] ?? FALLBACK_VISUAL;
  const borderClass = hasConflict ? 'border-b-2 border-danger-500' : '';
  return {
    barClass: visual.bar,
    chipClass: visual.chip,
    borderClass,
    statusIcon: visual.icon,
    urgencyBadge: event.urgency !== 'MEDIUM' ? <UrgencyBadge urgency={event.urgency} /> : null,
    conflictBadge: hasConflict ? <ConflictBadge /> : null,
  };
}

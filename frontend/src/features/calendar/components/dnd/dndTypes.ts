export const DND_BAR = 'bar' as const;
export const DND_LANE = 'lane' as const;
export const DND_WEEK_CARD = 'week-card' as const;
export const DND_WEEK_DAY_SLOT = 'week-day-slot' as const;

export interface WeekCardDragData {
  readonly type: typeof DND_WEEK_CARD;
  readonly executionId: number;
  readonly dayIso: string;
}

export interface WeekDaySlotDropData {
  readonly type: typeof DND_WEEK_DAY_SLOT;
  readonly dayIso: string;
  readonly slotMinute: number;
}

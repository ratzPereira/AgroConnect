import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Briefcase, Users, Wrench } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GanttSidebar } from './GanttSidebar';
import { GanttTimeline } from './GanttTimeline';
import { GanttMobileAgenda } from './GanttMobileAgenda';
import { ConflictBanner } from './ConflictBanner';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CalendarEvent, ConflictResponse, GanttView, GanttRow, GanttBar } from '@/types/calendar';

interface GanttChartProps {
  readonly events: CalendarEvent[];
  readonly conflicts: ConflictResponse[];
  readonly isLoading: boolean;
  readonly year: number;
  readonly month: number;
  readonly onChangeMonth: (year: number, month: number) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const VIEW_OPTIONS: { key: GanttView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'jobs', label: 'Trabalhos', icon: Briefcase },
  { key: 'team', label: 'Equipa', icon: Users },
  { key: 'machines', label: 'Máquinas', icon: Wrench },
];

function buildConflictSet(conflicts: ConflictResponse[]): Set<string> {
  const set = new Set<string>();
  for (const c of conflicts) {
    for (const e of c.conflictingEvents) {
      set.add(String(e.executionId));
    }
  }
  return set;
}

function toGanttBar(event: CalendarEvent, conflictSet: Set<string>): GanttBar {
  return {
    executionId: event.executionId,
    requestId: event.requestId,
    requestTitle: event.requestTitle,
    categoryName: event.categoryName,
    startDate: event.scheduledDate,
    endDate: event.scheduledEndDate,
    urgency: event.urgency,
    status: event.status,
    island: event.island,
    parish: event.parish,
    hasConflict: conflictSet.has(String(event.executionId)),
  };
}

function buildJobsView(events: CalendarEvent[], conflictSet: Set<string>): GanttRow[] {
  return events.map((event) => ({
    id: `job-${event.executionId}`,
    label: event.requestTitle,
    sublabel: event.categoryName,
    bars: [toGanttBar(event, conflictSet)],
  }));
}

function buildTeamView(events: CalendarEvent[], conflictSet: Set<string>): GanttRow[] {
  const teamMap = new Map<number, { name: string; bars: GanttBar[] }>();

  for (const event of events) {
    for (const assignment of event.assignments) {
      let entry = teamMap.get(assignment.teamMemberId);
      if (!entry) {
        entry = { name: assignment.teamMemberName, bars: [] };
        teamMap.set(assignment.teamMemberId, entry);
      }
      entry.bars.push(toGanttBar(event, conflictSet));
    }
  }

  return Array.from(teamMap.entries())
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .map(([id, data]) => ({
      id: `team-${id}`,
      label: data.name,
      sublabel: `${data.bars.length} trabalho${data.bars.length > 1 ? 's' : ''}`,
      bars: data.bars,
    }));
}

function buildMachinesView(events: CalendarEvent[], conflictSet: Set<string>): GanttRow[] {
  const machineMap = new Map<number, { name: string; bars: GanttBar[] }>();

  for (const event of events) {
    for (const assignment of event.assignments) {
      if (assignment.machineId == null) continue;
      let entry = machineMap.get(assignment.machineId);
      if (!entry) {
        entry = { name: assignment.machineName ?? `Máquina #${assignment.machineId}`, bars: [] };
        machineMap.set(assignment.machineId, entry);
      }
      entry.bars.push(toGanttBar(event, conflictSet));
    }
  }

  return Array.from(machineMap.entries())
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .map(([id, data]) => ({
      id: `machine-${id}`,
      label: data.name,
      sublabel: `${data.bars.length} trabalho${data.bars.length > 1 ? 's' : ''}`,
      bars: data.bars,
    }));
}

export function GanttChart({ events, conflicts, isLoading, year, month, onChangeMonth }: GanttChartProps) {
  const [view, setView] = useState<GanttView>('jobs');

  const conflictSet = useMemo(() => buildConflictSet(conflicts), [conflicts]);

  const rows = useMemo(() => {
    switch (view) {
      case 'jobs':
        return buildJobsView(events, conflictSet);
      case 'team':
        return buildTeamView(events, conflictSet);
      case 'machines':
        return buildMachinesView(events, conflictSet);
    }
  }, [events, view, conflictSet]);

  function handlePrev() {
    if (month === 0) {
      onChangeMonth(year - 1, 11);
    } else {
      onChangeMonth(year, month - 1);
    }
  }

  function handleNext() {
    if (month === 11) {
      onChangeMonth(year + 1, 0);
    } else {
      onChangeMonth(year, month + 1);
    }
  }

  function handleToday() {
    const now = new Date();
    onChangeMonth(now.getFullYear(), now.getMonth());
  }

  const isCurrentMonth =
    year === new Date().getFullYear() && month === new Date().getMonth();

  return (
    <div>
      {/* Header: navigation + view toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-neutral-800 min-w-[180px] text-center font-display">
              {MONTH_NAMES[month]} {year}
            </h2>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
              aria-label="Mês seguinte"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          {!isCurrentMonth && (
            <button
              onClick={handleToday}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 px-2 py-1 rounded-md hover:bg-primary-50 transition-colors"
            >
              Hoje
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setView(opt.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                view === opt.key
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700',
              )}
            >
              <opt.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conflicts */}
      <ConflictBanner conflicts={conflicts} />

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <Skeleton.Rect className="h-12" />
          <Skeleton.Rect className="h-[300px]" />
        </div>
      )}

      {/* Gantt chart (desktop) */}
      {!isLoading && (
        <>
          <div className="hidden md:flex rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden min-h-[520px]">
            <GanttSidebar rows={rows} />
            <GanttTimeline rows={rows} year={year} month={month} />
          </div>

          {/* Mobile agenda fallback */}
          <div className="md:hidden">
            <GanttMobileAgenda events={events} year={year} month={month} />
          </div>
        </>
      )}

      {/* Summary bar */}
      {!isLoading && events.length > 0 && (
        <div className="flex items-center gap-4 mt-3 px-1 text-xs text-neutral-400">
          <span>{events.length} trabalho{events.length === 1 ? '' : 's'}</span>
          <span className="h-3 w-px bg-neutral-200" />
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-danger-500" /> Urgente
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-warning-500" /> Alta
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary-500" /> Média
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-secondary-400" /> Baixa
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

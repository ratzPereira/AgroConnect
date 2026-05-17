import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Wrench, Banknote, FileSignature, ArrowRight, CalendarClock } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { CalendarAlerts, CalendarEvent } from '@/types/calendar';
import { parseIsoDate } from '../../utils/viewRange';

interface SideRailProps {
  readonly alerts: CalendarAlerts | undefined;
  readonly events: CalendarEvent[];
  readonly isLoading: boolean;
  readonly anchorIso: string;
}

function formatDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
}

interface AlertItem {
  key: string;
  icon: typeof AlertTriangle;
  tone: 'danger' | 'warning' | 'primary';
  title: string;
  meta: string;
  onClick?: () => void;
}

export function SideRail({ alerts, events, isLoading, anchorIso }: SideRailProps) {
  const navigate = useNavigate();

  const alertItems = useMemo<AlertItem[]>(() => {
    if (!alerts) return [];
    const items: AlertItem[] = [];
    for (const c of alerts.conflicts) {
      items.push({
        key: `conflict-${c.resourceType}-${c.resourceId}-${c.date}`,
        icon: AlertTriangle,
        tone: 'danger',
        title: `${c.overlappingCount} sobreposições · ${c.resourceName}`,
        meta: formatDate(c.date),
      });
    }
    for (const m of alerts.maintenance) {
      items.push({
        key: `maint-${m.maintenanceLogId}`,
        icon: Wrench,
        tone: 'warning',
        title: `Manutenção em atraso · ${m.machineName}`,
        meta: formatDate(m.dueDate),
        onClick: () => navigate(`/provider/machines/${m.machineId}`),
      });
    }
    for (const p of alerts.payments) {
      items.push({
        key: `pay-${p.executionId}`,
        icon: Banknote,
        tone: 'warning',
        title: `${p.daysAwaiting}d à espera de confirmação`,
        meta: p.requestTitle,
      });
    }
    for (const pr of alerts.proposals) {
      items.push({
        key: `prop-${pr.requestId}`,
        icon: FileSignature,
        tone: 'primary',
        title: `${pr.competingProposals} propostas concorrentes`,
        meta: pr.requestTitle,
        onClick: () => navigate(`/requests/${pr.requestId}`),
      });
    }
    return items;
  }, [alerts, navigate]);

  const upcoming = useMemo(() => {
    const sorted = [...events]
      .filter((e) => e.scheduledDate >= anchorIso)
      .sort((a, b) => {
        if (a.scheduledDate !== b.scheduledDate) return a.scheduledDate.localeCompare(b.scheduledDate);
        const at = a.scheduledStartTime ?? '00:00';
        const bt = b.scheduledStartTime ?? '00:00';
        return at.localeCompare(bt);
      })
      .slice(0, 6);
    return sorted;
  }, [events, anchorIso]);

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-80">
      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-800">Avisos</h3>
          {!isLoading && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
              {alertItems.length}
            </span>
          )}
        </header>
        {isLoading && (
          <div className="space-y-2">
            <div className="h-12 animate-pulse rounded bg-neutral-100" />
            <div className="h-12 animate-pulse rounded bg-neutral-100" />
          </div>
        )}
        {!isLoading && alertItems.length === 0 && (
          <p className="rounded-md bg-leaf-50 px-3 py-3 text-xs text-leaf-800">Sem alertas. Tudo a correr bem.</p>
        )}
        {!isLoading && alertItems.length > 0 && (
          <ul className="space-y-1.5">
            {alertItems.slice(0, 8).map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.key}>
                  <button
                    type="button"
                    onClick={a.onClick}
                    disabled={!a.onClick}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-colors',
                      a.tone === 'danger' && 'border-danger-200 bg-danger-50 hover:bg-danger-100/70',
                      a.tone === 'warning' && 'border-warning-200 bg-warning-50 hover:bg-warning-100/70',
                      a.tone === 'primary' && 'border-primary-200 bg-primary-50 hover:bg-primary-100/70',
                      !a.onClick && 'cursor-default opacity-95',
                    )}
                  >
                    <Icon
                      className={cn(
                        'mt-0.5 h-3.5 w-3.5 flex-shrink-0',
                        a.tone === 'danger' && 'text-danger-600',
                        a.tone === 'warning' && 'text-warning-600',
                        a.tone === 'primary' && 'text-primary-600',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-neutral-800">{a.title}</p>
                      <p className="truncate text-neutral-500">{a.meta}</p>
                    </div>
                    {a.onClick && <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-800">Próximos trabalhos</h3>
          <CalendarClock className="h-4 w-4 text-neutral-400" />
        </header>
        {upcoming.length === 0 && (
          <p className="text-xs text-neutral-500">Sem trabalhos agendados a seguir.</p>
        )}
        {upcoming.length > 0 && (
          <ul className="space-y-1.5">
            {upcoming.map((e) => (
              <li key={e.executionId}>
                <button
                  type="button"
                  onClick={() => navigate(`/requests/${e.requestId}`)}
                  className="flex w-full items-center gap-2 rounded-md border border-neutral-100 px-2.5 py-1.5 text-left text-xs hover:bg-neutral-50"
                >
                  <span className="rounded bg-primary-50 px-1.5 py-0.5 font-mono text-[10px] text-primary-700">
                    {e.scheduledAllDay
                      ? formatDate(e.scheduledDate)
                      : formatDateTime(`${e.scheduledDate}T${e.scheduledStartTime ?? '00:00'}`)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-neutral-800">{e.requestTitle}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}

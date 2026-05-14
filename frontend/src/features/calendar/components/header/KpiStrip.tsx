import { Briefcase, Activity, CheckCircle2, AlertTriangle, Banknote, Users, Gauge } from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/utils/cn';
import type { CalendarSummary } from '@/types/calendar';

interface KpiStripProps {
  readonly summary: CalendarSummary | undefined;
  readonly isLoading: boolean;
}

interface Tile {
  label: string;
  value: string;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

function formatNumber(value: number | undefined): string {
  return value == null ? '–' : value.toLocaleString('pt-PT');
}

function formatCurrency(value: number | undefined): string {
  if (value == null) return '–';
  return value.toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });
}

function getUtilizationTone(utilization: number): Tile['tone'] {
  if (utilization >= 0.9) return 'danger';
  if (utilization >= 0.7) return 'warning';
  return 'success';
}

function formatPercent(ratio: number | undefined): string {
  if (ratio == null) return '–';
  return `${Math.round(ratio * 100)}%`;
}

const TONE_STYLES: Record<Tile['tone'], string> = {
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  success: 'bg-leaf-50 text-leaf-700 border-leaf-200',
  warning: 'bg-warning-50 text-warning-800 border-warning-200',
  danger: 'bg-danger-50 text-danger-700 border-danger-200',
  neutral: 'bg-neutral-50 text-neutral-700 border-neutral-200',
};

function buildTiles(summary: CalendarSummary | undefined): Tile[] {
  if (!summary) return [];
  return [
    {
      label: 'Trabalhos no período',
      value: formatNumber(summary.totalEvents),
      hint: `${summary.inProgress} em curso`,
      icon: Briefcase,
      tone: 'primary',
    },
    {
      label: 'Em curso',
      value: formatNumber(summary.inProgress),
      icon: Activity,
      tone: 'primary',
    },
    {
      label: 'A confirmar',
      value: formatNumber(summary.awaitingConfirmation),
      hint: 'cliente por validar',
      icon: CheckCircle2,
      tone: 'warning',
    },
    {
      label: 'Concluídos',
      value: formatNumber(summary.completed),
      icon: CheckCircle2,
      tone: 'success',
    },
    {
      label: 'Conflitos',
      value: formatNumber(summary.conflicting),
      hint: summary.conflicting > 0 ? 'requer atenção' : 'tudo ok',
      icon: AlertTriangle,
      tone: summary.conflicting > 0 ? 'danger' : 'neutral',
    },
    {
      label: 'Receita estimada',
      value: formatCurrency(summary.totalRevenue),
      icon: Banknote,
      tone: 'success',
    },
    {
      label: 'Operadores ativos',
      value: formatNumber(summary.activeOperators),
      hint: `${summary.activeMachines} máquinas`,
      icon: Users,
      tone: 'primary',
    },
    {
      label: 'Utilização',
      value: formatPercent(summary.operatorUtilization),
      hint: 'da capacidade total',
      icon: Gauge,
      tone: getUtilizationTone(summary.operatorUtilization),
    },
  ];
}

export function KpiStrip({ summary, isLoading }: KpiStripProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {['kpi-0', 'kpi-1', 'kpi-2', 'kpi-3', 'kpi-4', 'kpi-5', 'kpi-6', 'kpi-7'].map(k => (
          <div key={k} className="h-20 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100" />
        ))}
      </div>
    );
  }

  const tiles = buildTiles(summary);
  if (tiles.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <div
            key={t.label}
            className={cn('flex flex-col gap-1 rounded-lg border px-3 py-2.5', TONE_STYLES[t.tone])}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">{t.label}</span>
              <Icon className="h-3.5 w-3.5 opacity-70" />
            </div>
            <span className="text-xl font-bold font-display leading-tight">{t.value}</span>
            {t.hint && <span className="text-[10px] opacity-70">{t.hint}</span>}
          </div>
        );
      })}
    </div>
  );
}

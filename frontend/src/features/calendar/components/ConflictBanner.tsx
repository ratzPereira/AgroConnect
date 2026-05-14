import { AlertTriangle } from 'lucide-react';
import type { ConflictResponse } from '@/types/calendar';

interface ConflictBannerProps {
  readonly conflicts: ConflictResponse[];
}

export function ConflictBanner({ conflicts }: ConflictBannerProps) {
  if (conflicts.length === 0) return null;

  const uniqueResources = new Set(conflicts.map((c) => `${c.resourceType}:${c.resourceId}`));

  return (
    <div className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-warning-500 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-warning-700">
            {uniqueResources.size} conflito{uniqueResources.size > 1 ? 's' : ''} detetado{uniqueResources.size > 1 ? 's' : ''}
          </p>
          <ul className="mt-1.5 space-y-1">
            {conflicts.slice(0, 5).map((conflict) => (
              <li key={`${conflict.resourceType}-${conflict.resourceId}-${conflict.date}`} className="text-xs text-warning-600">
                <span className="font-medium">{conflict.resourceName}</span>
                {' '}({conflict.resourceType === 'TEAM_MEMBER' ? 'Membro' : 'Máquina'})
                {' — '}
                {conflict.conflictingEvents.map((e) => e.requestTitle).join(' / ')}
                {' em '}{new Date(conflict.date + 'T00:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
              </li>
            ))}
          </ul>
          {conflicts.length > 5 && (
            <p className="text-xs text-warning-500 mt-1">
              +{conflicts.length - 5} conflitos adicionais
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

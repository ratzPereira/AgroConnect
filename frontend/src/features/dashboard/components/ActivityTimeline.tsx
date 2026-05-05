import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale/pt';
import { Bell } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Notification } from '@/types/notification';

interface ActivityTimelineProps {
  notifications: Notification[];
  className?: string;
}

export function ActivityTimeline({ notifications, className }: ActivityTimelineProps) {
  const navigate = useNavigate();

  if (notifications.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-sm text-neutral-500">Sem atividade recente</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-800">Atividade recente</h3>
        <Link to="/notifications" className="text-xs text-secondary-600 hover:underline">
          Ver tudo
        </Link>
      </div>
      {notifications.slice(0, 8).map((notif) => (
        <div
          key={notif.id}
          className={cn(
            'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150',
            !notif.read && 'bg-primary-50/50',
            notif.link && 'cursor-pointer hover:bg-neutral-50',
          )}
          onClick={() => notif.link && navigate(notif.link)}
          onKeyDown={(e) => {
            if (notif.link && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              navigate(notif.link);
            }
          }}
          role={notif.link ? 'button' : undefined}
          tabIndex={notif.link ? 0 : undefined}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100">
            <Bell className="h-4 w-4 text-neutral-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-neutral-800 truncate">{notif.title}</p>
            <p className="text-xs text-neutral-500 truncate">{notif.body}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: pt })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

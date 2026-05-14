import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyNotifications, markAsRead, markAllAsRead } from '@/api/notifications';
import { useNotificationStore } from '@/stores/notificationStore';
import { Bell } from 'lucide-react';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { unreadCount, resetUnread } = useNotificationStore();

  const markOneMutation = useMutation({
    mutationFn: (id: number) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications-preview'],
    queryFn: () => getMyNotifications(0, 5),
    enabled: open,
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  async function handleMarkAllRead() {
    try {
      await markAllAsRead();
      resetUnread();
    } catch {
      // Silently ignore
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5 text-neutral-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-neutral-200 shadow-dropdown z-50 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-900">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-green-600 hover:text-green-700 font-medium"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications && notifications.content.length > 0 ? (
              notifications.content.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    if (!notification.read) {
                      markOneMutation.mutate(notification.id);
                    }
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-neutral-50 last:border-0 transition-colors',
                    notification.read
                      ? 'hover:bg-neutral-50'
                      : 'bg-green-50/50 hover:bg-green-50',
                  )}
                >
                  <p className={cn('text-sm', notification.read ? 'font-medium text-neutral-700' : 'font-semibold text-neutral-900')}>{notification.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                    {notification.body}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-neutral-500">Sem notificações.</p>
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-neutral-100">
            <button
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
              className="w-full text-center text-xs text-green-600 hover:text-green-700 font-medium py-1"
            >
              Ver todas as notificações
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

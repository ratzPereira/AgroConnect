import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { getUnreadCount } from '@/api/notifications';
import { useAuthStore } from '@/stores/authStore';

const POLL_INTERVAL_MS = 30_000;

/**
 * Fetches unread notification count on mount and polls periodically.
 *
 * WebSocket support (SockJS + @stomp/stompjs) can be enabled once those
 * packages are installed. For now, polling is used as the fallback strategy.
 */
export function useNotifications() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setUnreadCount } = useNotificationStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    function fetchCount() {
      getUnreadCount()
        .then((data) => setUnreadCount(data.count))
        .catch(() => {
          // Silently ignore — the user may not have notifications enabled yet
        });
    }

    fetchCount();

    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, setUnreadCount]);
}

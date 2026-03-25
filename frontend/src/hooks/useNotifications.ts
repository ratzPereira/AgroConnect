import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { getUnreadCount } from '@/api/notifications';
import { useAuthStore } from '@/stores/authStore';
import { useStompSubscription } from '@/hooks/useStompClient';
import { toast } from 'sonner';

const POLL_INTERVAL_MS = 60_000;

/**
 * Subscribes to real-time notifications via WebSocket (STOMP/SockJS)
 * and polls unread count as a fallback every 60 seconds.
 */
export function useNotifications() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setUnreadCount, incrementUnread } = useNotificationStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);

  // WebSocket subscription for real-time notifications
  useStompSubscription(
    `/user/${userId}/queue/notifications`,
    (msg) => {
      try {
        const notification = JSON.parse(msg.body);
        incrementUnread();
        toast(notification.title, {
          description: notification.body,
        });
      } catch {
        incrementUnread();
      }
    },
    isAuthenticated && userId != null,
  );

  // Polling fallback for unread count
  useEffect(() => {
    if (!isAuthenticated) return;

    function fetchCount() {
      getUnreadCount()
        .then((data) => setUnreadCount(data.count))
        .catch(() => {
          // Silently ignore — network errors are expected when offline
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

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyNotifications, markAllAsRead } from '@/api/notifications';
import { useNotificationStore } from '@/stores/notificationStore';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCheck } from 'lucide-react';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';

export function Notifications() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const { resetUnread } = useNotificationStore();

  const { data, isLoading } = useQuery({
    queryKey: ['my-notifications', page],
    queryFn: () => getMyNotifications(page, 20),
  });

  const markReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      resetUnread();
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
    },
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900">
            Notificações
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Todas as suas notificações
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markReadMutation.mutate()}
          loading={markReadMutation.isPending}
        >
          <CheckCheck className="h-4 w-4" />
          Marcar todas como lidas
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      ) : data && data.content.length > 0 ? (
        <>
          <div className="space-y-3">
            {data.content.map((notification) => (
              <Card key={notification.id}>
                <CardBody>
                  <div
                    className={cn(
                      'flex items-start gap-3',
                      !notification.read && 'relative',
                    )}
                  >
                    {!notification.read && (
                      <span className="absolute -left-2 top-2 h-2 w-2 rounded-full bg-green-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            'text-sm',
                            notification.read
                              ? 'text-neutral-700'
                              : 'text-neutral-900 font-semibold',
                          )}
                        >
                          {notification.title}
                        </p>
                        <span className="text-xs text-neutral-400 shrink-0">
                          {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 mt-1">{notification.body}</p>
                      {notification.type && (
                        <span className="inline-block mt-2 text-[10px] font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
                          {notification.type}
                        </span>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={data.first}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="inline-flex items-center text-sm text-neutral-500">
                {data.number + 1} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.last}
                onClick={() => setPage((p) => p + 1)}
              >
                Seguinte
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-neutral-500">Sem notificações.</p>
        </div>
      )}
    </div>
  );
}

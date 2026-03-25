import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getMyNotifications, markAsRead, markAllAsRead } from '@/api/notifications';
import { useNotificationStore } from '@/stores/notificationStore';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { EmptyNotifications } from '@/components/illustrations/EmptyNotifications';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useMotionConfig } from '@/hooks/useMotionConfig';
import { CheckCheck } from 'lucide-react';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import type { Notification } from '@/types/notification';

export function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const { resetUnread } = useNotificationStore();
  const { listContainerVariants, listItemVariants } = useMotionConfig();

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      markOneMutation.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  }

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

  const markOneMutation = useMutation({
    mutationFn: (id: number) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
    },
  });

  return (
    <AnimatedPage>
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
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton.Card key={i} />
          ))}
        </div>
      ) : data && data.content.length > 0 ? (
        <>
          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {data.content.map((notification) => (
              <motion.div variants={listItemVariants} key={notification.id}>
                <Card
                  className={cn(
                    (!notification.read || notification.link) && 'cursor-pointer hover:border-primary-200 transition-colors',
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardBody>
                    <div
                      className={cn(
                        'flex items-start gap-3',
                        !notification.read && 'relative',
                      )}
                    >
                      {!notification.read && (
                        <span className="absolute -left-2 top-2 h-2 w-2 rounded-full bg-primary-500" />
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
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </motion.div>
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
        <EmptyState
          illustration={<EmptyNotifications className="w-48 h-auto" />}
          title="Tudo em dia!"
          description="Não tem notificações pendentes. Voltaremos a avisá-lo quando houver novidades."
        />
      )}
    </AnimatedPage>
  );
}

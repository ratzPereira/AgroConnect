import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('[PWA] Service worker registration failed:', error);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    const toastId = toast('Nova versão disponível', {
      description: 'Atualize para carregar a versão mais recente da aplicação.',
      duration: Infinity,
      action: {
        label: 'Atualizar',
        onClick: () => {
          toast.dismiss(toastId);
          void updateServiceWorker(true);
        },
      },
      onDismiss: () => setNeedRefresh(false),
    });
    return () => {
      toast.dismiss(toastId);
    };
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}

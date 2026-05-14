import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('pwa-install-dismissed') === 'true';
  });

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    globalThis.addEventListener('beforeinstallprompt', handler);
    return () => globalThis.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const canInstall = !!deferredPrompt && !dismissed;

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  }

  return { canInstall, install, dismiss };
}

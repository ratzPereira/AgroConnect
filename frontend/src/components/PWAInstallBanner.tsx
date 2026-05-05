import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X } from 'lucide-react';

export function PWAInstallBanner() {
  const { canInstall, install, dismiss } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 lg:bottom-4 lg:left-auto lg:right-4 lg:w-80">
      <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-4 flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <Download className="w-5 h-5 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900">Instalar AgroConnect</p>
          <p className="text-xs text-neutral-500">Acesso rápido no seu ecrã</p>
        </div>
        <button
          onClick={install}
          className="flex-shrink-0 px-3 py-1.5 bg-primary-500 text-white text-xs font-semibold rounded-lg hover:bg-primary-600 transition-colors"
        >
          Instalar
        </button>
        <button
          onClick={dismiss}
          className="flex-shrink-0 p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

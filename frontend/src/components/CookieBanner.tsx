import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useCookieStore } from '@/stores/cookieStore';

export function CookieBanner() {
  const { consent, accept, reject } = useCookieStore();

  return (
    <AnimatePresence>
      {consent === null && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-lg p-4"
        >
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4">
            <p className="text-sm text-neutral-600 flex-1">
              Utilizamos cookies para melhorar a sua experiência. Consulte a nossa{' '}
              <Link to="/privacy" className="text-green-600 hover:underline">
                Política de Privacidade
              </Link>{' '}
              para mais informações.
            </p>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={reject}>
                Rejeitar
              </Button>
              <Button size="sm" onClick={accept}>
                Aceitar
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

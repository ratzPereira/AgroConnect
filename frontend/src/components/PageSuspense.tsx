import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface PageSuspenseProps {
  children: React.ReactNode;
}

function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
    </div>
  );
}

export function PageSuspense({ children }: PageSuspenseProps) {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      {children}
    </Suspense>
  );
}

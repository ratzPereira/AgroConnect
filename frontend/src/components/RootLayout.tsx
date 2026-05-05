import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { CookieBanner } from '@/components/CookieBanner';

export function RootLayout() {
  // Clear the stale-chunk reload flag so future deploys can auto-reload again
  useEffect(() => {
    sessionStorage.removeItem('chunk_reload');
  }, []);

  return (
    <>
      <Outlet />
      <CookieBanner />
    </>
  );
}

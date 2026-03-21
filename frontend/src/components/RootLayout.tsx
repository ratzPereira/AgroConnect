import { Outlet } from 'react-router-dom';
import { CookieBanner } from '@/components/CookieBanner';

export function RootLayout() {
  return (
    <>
      <Outlet />
      <CookieBanner />
    </>
  );
}

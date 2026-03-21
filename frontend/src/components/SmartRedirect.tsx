import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function SmartRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return <Navigate to={isAuthenticated ? '/dashboard' : '/landing'} replace />;
}

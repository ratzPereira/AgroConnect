import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function SmartRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.user?.role);

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }
  if (role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

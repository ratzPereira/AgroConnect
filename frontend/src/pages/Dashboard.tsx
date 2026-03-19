import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { logout as logoutApi } from '@/api/auth';
import { Button } from '@/components/ui/Button';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      // Even if API call fails, clear local state
    }
    logout();
    navigate('/login');
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900">
            Dashboard
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            Bem-vindo, {user?.name ?? 'utilizador'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Terminar sessão
        </Button>
      </div>
    </div>
  );
}

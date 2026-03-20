import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { logout as logoutApi } from '@/api/auth';
import { cn } from '@/utils/cn';
import { LayoutDashboard, FileText, LogOut } from 'lucide-react';

export function MainLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      // Clear local state even if API call fails
    }
    logout();
    navigate('/login');
  }

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/requests', label: 'Pedidos', icon: FileText },
  ];

  return (
    <div className="min-h-svh flex">
      <aside className="hidden lg:flex w-60 flex-col bg-neutral-900 text-neutral-200">
        <div className="p-6">
          <img src="/logotipo.png" alt="AgroConnect" className="h-10" />
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-4">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            <p className="text-sm font-medium text-neutral-300 truncate">{user?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Terminar sessão
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-neutral-50">
        <div className="max-w-[1200px] mx-auto px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

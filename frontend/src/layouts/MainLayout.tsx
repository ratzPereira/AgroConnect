import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { logout as logoutApi } from '@/api/auth';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/NotificationBell';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MobileNav } from '@/components/MobileNav';
import { cn } from '@/utils/cn';
import {
  LayoutDashboard, FileText, CreditCard, Bell, LogOut,
  Users, Wrench, Package, DollarSign, Shield, UserCog,
} from 'lucide-react';
import type { Role } from '@/types/auth';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function buildNavItems(role?: Role): NavItem[] {
  const common: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/requests', label: 'Pedidos', icon: FileText },
    { to: '/transactions', label: 'Transações', icon: CreditCard },
    { to: '/notifications', label: 'Notificações', icon: Bell },
  ];

  const providerItems: NavItem[] = [
    { to: '/provider/dashboard', label: 'Backoffice', icon: LayoutDashboard },
    { to: '/provider/team', label: 'Equipa', icon: Users },
    { to: '/provider/machines', label: 'Máquinas', icon: Wrench },
    { to: '/provider/inventory', label: 'Inventário', icon: Package },
    { to: '/provider/finance', label: 'Finanças', icon: DollarSign },
  ];

  const adminItems: NavItem[] = [
    { to: '/admin/dashboard', label: 'Administração', icon: Shield },
    { to: '/admin/users', label: 'Utilizadores', icon: UserCog },
  ];

  if (role === 'PROVIDER_MANAGER' || role === 'PROVIDER_LEAD' || role === 'PROVIDER_OPERATOR') {
    return [...common, ...providerItems];
  }
  if (role === 'ADMIN') {
    return [...common, ...adminItems];
  }
  return common;
}

export function MainLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useNotifications();

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      // Clear local state even if API call fails
    }
    logout();
    navigate('/login');
  }

  const navItems = buildNavItems(user?.role);

  return (
    <div className="min-h-svh flex">
      {/* Desktop sidebar */}
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
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150',
                  isActive
                    ? 'bg-primary-950 text-primary-400 font-medium border-l-[3px] border-primary-400'
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

      <main className="flex-1 bg-neutral-50 pb-16 lg:pb-0">
        {/* Mobile top header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white lg:hidden">
          <img src="/logotipo.png" alt="AgroConnect" className="h-8" />
          <NotificationBell />
        </div>

        <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
          {/* Desktop notification bell */}
          <div className="hidden lg:flex justify-end mb-4">
            <NotificationBell />
          </div>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}

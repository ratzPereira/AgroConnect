import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Bell, User, Briefcase, Shield, Store, DollarSign } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn } from '@/utils/cn';
import type { Role } from '@/types/auth';
import type { ComponentType } from 'react';

interface MobileNavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
}

function buildMobileNavItems(role: Role | undefined, unreadCount: number): MobileNavItem[] {
  const base: MobileNavItem[] = [
    { to: '/dashboard', label: 'Início', icon: LayoutDashboard },
    { to: '/requests', label: 'Pedidos', icon: FileText },
    { to: '/marketplace', label: 'Marketplace', icon: Store },
  ];

  const isProvider = role === 'PROVIDER_MANAGER' || role === 'PROVIDER_LEAD' || role === 'PROVIDER_OPERATOR';
  const isAdmin = role === 'ADMIN';

  if (isAdmin) {
    // Admin-only pages — generic client/provider pages would hit unauthorized endpoints.
    return [
      { to: '/admin/dashboard', label: 'Admin', icon: Shield },
      { to: '/admin/users', label: 'Utilizadores', icon: User },
      { to: '/admin/listings', label: 'Moderação', icon: Store },
      { to: '/notifications', label: 'Alertas', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    ];
  }

  if (isProvider) {
    base.push(
      { to: '/provider/team', label: 'Equipa', icon: Briefcase },
      { to: '/provider/finance', label: 'Finanças', icon: DollarSign },
    );
  }

  base.push(
    { to: '/notifications', label: 'Alertas', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { to: '/profile', label: 'Perfil', icon: User },
  );

  return base;
}

export function MobileNav() {
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const items = buildMobileNavItems(user?.role, unreadCount);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t border-neutral-200 bg-white/80 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to + item.label}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'relative flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors duration-150',
              isActive ? 'text-primary-600' : 'text-neutral-400',
            )
          }
        >
          <div className="relative">
            <item.icon className="h-5 w-5" />
            {item.badge !== undefined && (
              <span className="absolute -top-1 -right-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-danger-600 px-0.5 text-[9px] font-bold text-white">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </div>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

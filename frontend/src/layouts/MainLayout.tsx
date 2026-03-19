import { Outlet } from 'react-router-dom';

export function MainLayout() {
  return (
    <div className="min-h-svh flex">
      {/* Sidebar placeholder — Sprint 2+ */}
      <aside className="hidden lg:flex w-60 flex-col bg-neutral-900 text-neutral-200">
        <div className="p-6">
          <img src="/logotipo.png" alt="AgroConnect" className="h-10" />
        </div>
        <nav className="flex-1 px-3">
          <p className="text-xs text-neutral-500 px-3 py-2">
            Navegação será implementada nos próximos sprints
          </p>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-neutral-50">
        <div className="max-w-[1200px] mx-auto px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

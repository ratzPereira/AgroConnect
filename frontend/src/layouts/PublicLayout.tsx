import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { Menu, X } from 'lucide-react';

export function PublicLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-svh flex flex-col">
      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-40 bg-white/80 backdrop-blur-lg border-b border-neutral-200">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Logo */}
          <Link to="/" className="font-display text-xl font-bold text-green-700">
            AgroConnect
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#como-funciona"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Como Funciona
            </a>
            <a
              href="#funcionalidades"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Funcionalidades
            </a>
            <Link
              to="/terms"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Termos
            </Link>
            <Link
              to="/privacy"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Privacidade
            </Link>

            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Registar
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            'md:hidden overflow-hidden transition-all duration-200 ease-in-out border-t border-neutral-200 bg-white/95 backdrop-blur-lg',
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 border-t-0',
          )}
        >
          <nav className="flex flex-col gap-1 px-4 py-4">
            <a
              href="#como-funciona"
              className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Como Funciona
            </a>
            <a
              href="#funcionalidades"
              className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Funcionalidades
            </a>
            <Link
              to="/terms"
              className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Termos
            </Link>
            <Link
              to="/privacy"
              className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Privacidade
            </Link>

            <div className="mt-2 flex flex-col gap-2 px-3">
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      Registar
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left */}
            <div>
              <span className="font-display text-lg font-bold text-white">AgroConnect</span>
              <p className="mt-2 text-sm">Serviços agrícolas nos Açores</p>
            </div>

            {/* Center */}
            <div className="flex flex-col gap-2">
              <Link
                to="/terms"
                className="text-sm hover:text-neutral-200 transition-colors"
              >
                Termos de Serviço
              </Link>
              <Link
                to="/privacy"
                className="text-sm hover:text-neutral-200 transition-colors"
              >
                Política de Privacidade
              </Link>
            </div>

            {/* Right */}
            <div className="flex flex-col gap-1 text-sm">
              <p>&copy; 2026 AgroConnect. Todos os direitos reservados.</p>
              <p>Projeto LEI &mdash; Universidade Aberta</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

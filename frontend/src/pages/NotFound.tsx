import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-neutral-50">
      <h1 className="text-[64px] font-bold text-neutral-300">404</h1>
      <p className="text-lg text-neutral-600 mt-2">Página não encontrada</p>
      <Link
        to="/"
        className="mt-6 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors duration-150"
      >
        Voltar ao início
      </Link>
    </div>
  );
}

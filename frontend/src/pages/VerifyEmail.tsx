import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '@/api/auth';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error',
  );
  const [message, setMessage] = useState(token ? '' : 'Token de verificação em falta.');

  useEffect(() => {
    if (!token) return;

    verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err: unknown) => {
        setStatus('error');
        if (
          typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          typeof (err as Record<string, unknown>).response === 'object'
        ) {
          const axiosErr = err as { response: { data?: { message?: string } } };
          setMessage(axiosErr.response.data?.message ?? 'Não foi possível verificar o email.');
        } else {
          setMessage('Não foi possível verificar o email.');
        }
      });
  }, [token]);

  return (
    <div className="min-h-svh flex items-center justify-center bg-neutral-50">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 w-full max-w-md text-center">
        <img src="/logotipo.png" alt="AgroConnect" className="h-16 mx-auto mb-6" />
        {status === 'loading' && <p className="text-neutral-600">A verificar o seu email...</p>}
        {status === 'success' && (
          <>
            <h1 className="text-xl font-semibold text-green-700 mb-4">Email Verificado</h1>
            <p className="text-sm text-neutral-600 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Iniciar Sessão
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-xl font-semibold text-red-700 mb-4">Erro na Verificação</h1>
            <p className="text-sm text-neutral-600 mb-6">{message}</p>
            <Link to="/login" className="text-green-600 hover:text-green-700 font-medium text-sm">
              Voltar ao login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

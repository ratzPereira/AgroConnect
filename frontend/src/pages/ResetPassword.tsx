import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z
  .object({
    newPassword: z.string().min(8, 'A palavra-passe deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a palavra-passe'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As palavras-passe não coincidem',
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof schema>;

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(schema),
  });

  if (!token) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-neutral-50">
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 w-full max-w-md text-center">
          <h1 className="text-xl font-semibold text-red-700 mb-4">Link Inválido</h1>
          <p className="text-sm text-neutral-600 mb-6">O link de redefinição é inválido ou está em falta.</p>
          <Link to="/forgot-password" className="text-green-600 hover:text-green-700 font-medium text-sm">
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  const validToken = token;

  async function onSubmit(data: ResetPasswordForm) {
    setError(null);
    try {
      await resetPassword({ token: validToken, newPassword: data.newPassword });
      setSuccess(true);
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as Record<string, unknown>).response === 'object'
      ) {
        const axiosErr = err as { response: { data?: { message?: string } } };
        setError(axiosErr.response.data?.message ?? 'Não foi possível redefinir a palavra-passe.');
      } else {
        setError('Não foi possível ligar ao servidor.');
      }
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-neutral-50">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 w-full max-w-md">
        <img src="/logotipo.png" alt="AgroConnect" className="h-16 mx-auto mb-6" />
        <h1 className="text-xl font-semibold text-neutral-800 text-center mb-6">Nova Palavra-passe</h1>

        {success ? (
          <div className="text-center">
            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              Palavra-passe alterada com sucesso.
            </div>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Iniciar Sessão
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                id="newPassword"
                label="Nova palavra-passe"
                type="password"
                placeholder="••••••••"
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />
              <Input
                id="confirmPassword"
                label="Confirmar palavra-passe"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <Button type="submit" className="w-full" loading={isSubmitting}>
                Redefinir Palavra-passe
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

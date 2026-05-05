import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPassword } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  email: z.string().min(1, 'O email é obrigatório').email('Email inválido'),
});

type ForgotPasswordForm = z.infer<typeof schema>;

export function ForgotPassword() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: ForgotPasswordForm) {
    setError(null);
    try {
      await forgotPassword({ email: data.email });
      setSuccess(true);
    } catch {
      setError('Não foi possível processar o pedido. Tente novamente.');
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-neutral-50">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 w-full max-w-md">
        <img src="/logotipo.png" alt="AgroConnect" className="h-16 mx-auto mb-6" />
        <h1 className="text-xl font-semibold text-neutral-800 text-center mb-2">Recuperar Palavra-passe</h1>
        <p className="text-sm text-neutral-500 text-center mb-6">
          Introduza o seu email e enviaremos um link para redefinir a sua palavra-passe.
        </p>

        {success ? (
          <div className="text-center">
            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              Se o email existir, receberá um link para redefinir a palavra-passe.
            </div>
            <Link to="/login" className="text-green-600 hover:text-green-700 font-medium text-sm">
              Voltar ao login
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
                id="email"
                label="Email"
                type="email"
                placeholder="joao@example.pt"
                error={errors.email?.message}
                {...register('email')}
              />
              <Button type="submit" className="w-full" loading={isSubmitting}>
                Enviar Link
              </Button>
            </form>
            <p className="text-sm text-neutral-500 text-center mt-6">
              <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                Voltar ao login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

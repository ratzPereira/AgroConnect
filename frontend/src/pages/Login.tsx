import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { login } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { LoginRequest } from '@/types/auth';

const loginSchema = z.object({
  email: z.string().min(1, 'O email é obrigatório').email('Email inválido'),
  password: z.string().min(1, 'A palavra-passe é obrigatória'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setError(null);
    try {
      const request: LoginRequest = { email: data.email, password: data.password };
      const response = await login(request);
      setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as Record<string, unknown>).response === 'object'
      ) {
        const axiosErr = err as { response: { status: number; data?: { message?: string } } };
        if (axiosErr.response.status === 401) {
          setError('Email ou palavra-passe incorretos.');
        } else {
          setError(axiosErr.response.data?.message ?? 'Ocorreu um erro. Tente novamente.');
        }
      } else {
        setError('Não foi possível ligar ao servidor.');
      }
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-neutral-50">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 w-full max-w-md">
        <img
          src="/logotipo.png"
          alt="AgroConnect"
          className="h-16 mx-auto mb-6"
        />
        <h1 className="text-xl font-semibold text-neutral-800 text-center mb-6">
          Entrar
        </h1>

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
          <Input
            id="password"
            label="Palavra-passe"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Entrar
          </Button>
        </form>

        <p className="text-sm text-neutral-500 text-center mt-6">
          Não tem conta?{' '}
          <Link to="/register" className="text-green-600 hover:text-green-700 font-medium">
            Registar
          </Link>
        </p>
      </div>
    </div>
  );
}

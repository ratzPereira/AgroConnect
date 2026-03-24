import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
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
        if (axiosErr.response.status === 403) {
          setError(axiosErr.response.data?.message ?? 'Verifique o seu email antes de iniciar sessão.');
        } else if (axiosErr.response.status === 401) {
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
    <div
      className="min-h-svh flex items-center justify-center px-4 py-10"
      style={{
        backgroundImage: 'url(/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Light overlay — keeps it subtle so glass card can show through */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'rgba(0,20,5,0.25)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full rounded-3xl p-8 sm:p-10"
        style={{
          maxWidth: 440,
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(20px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.5)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
        }}
      >
        {/* Back link */}
        <div className="flex justify-end mb-6">
          <Link
            to="/landing"
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
            style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>
        </div>

        <h1
          className="font-display text-3xl font-bold tracking-tight"
          style={{ color: '#1a1a1a', textShadow: '0 1px 2px rgba(255,255,255,0.4)' }}
        >
          Bem-vindo de volta
        </h1>
        <p className="text-base mt-2 mb-8" style={{ color: '#404040' }}>
          Introduza as suas credenciais para continuar.
        </p>

        {error && (
          <div
            className="mb-6 rounded-xl px-4 py-3.5 text-sm leading-relaxed"
            style={{ background: 'rgba(254, 242, 242, 0.9)', border: '1px solid rgba(254, 202, 202, 0.7)', color: '#b91c1c' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-5">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="joao@example.pt"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <div className="mb-4">
            <Input
              id="password"
              label="Palavra-passe"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div className="flex justify-end mb-6">
            <Link
              to="/forgot-password"
              className="text-sm transition-colors"
              style={{ color: '#525252' }}
            >
              Esqueceu a palavra-passe?
            </Link>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
            Entrar
          </Button>
        </form>

        <p className="text-sm text-center mt-8" style={{ color: '#404040' }}>
          Não tem conta?{' '}
          <Link to="/register" className="text-green-700 hover:text-green-800 font-semibold transition-colors">
            Criar conta
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

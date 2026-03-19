import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { register as registerApi } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { RegisterRequest } from '@/types/auth';

const registerSchema = z
  .object({
    name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
    email: z.string().min(1, 'O email é obrigatório').email('Email inválido'),
    password: z.string().min(8, 'A palavra-passe deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a palavra-passe'),
    role: z.enum(['CLIENT', 'PROVIDER_MANAGER'], {
      message: 'Selecione um tipo de conta',
    }),
    companyName: z.string().optional(),
    nif: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As palavras-passe não coincidem',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CLIENT' },
  });

  const selectedRole = watch('role');

  async function onSubmit(data: RegisterForm) {
    setError(null);
    try {
      const request: RegisterRequest = {
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        name: data.name,
        role: data.role,
        companyName: data.companyName,
        nif: data.nif,
      };
      const response = await registerApi(request);
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
        if (axiosErr.response.status === 409) {
          setError('Este email já está registado.');
        } else {
          setError(axiosErr.response.data?.message ?? 'Ocorreu um erro. Tente novamente.');
        }
      } else {
        setError('Não foi possível ligar ao servidor.');
      }
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-neutral-50 py-12">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 w-full max-w-md">
        <img
          src="/logotipo.png"
          alt="AgroConnect"
          className="h-16 mx-auto mb-6"
        />
        <h1 className="text-xl font-semibold text-neutral-800 text-center mb-6">
          Registar
        </h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Tipo de conta</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
                  selectedRole === 'CLIENT'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <input type="radio" value="CLIENT" className="sr-only" {...register('role')} />
                Agricultor
              </label>
              <label
                className={`flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
                  selectedRole === 'PROVIDER_MANAGER'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <input type="radio" value="PROVIDER_MANAGER" className="sr-only" {...register('role')} />
                Prestador
              </label>
            </div>
            {errors.role && <p className="text-xs text-red-600">{errors.role.message}</p>}
          </div>

          <Input
            id="name"
            label="Nome"
            placeholder="João Silva"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="joao@example.pt"
            error={errors.email?.message}
            {...register('email')}
          />

          {selectedRole === 'PROVIDER_MANAGER' && (
            <>
              <Input
                id="companyName"
                label="Nome da Empresa"
                placeholder="AgroServiços Lda"
                error={errors.companyName?.message}
                {...register('companyName')}
              />
              <Input
                id="nif"
                label="NIF"
                placeholder="123456789"
                error={errors.nif?.message}
                {...register('nif')}
              />
            </>
          )}

          <Input
            id="password"
            label="Palavra-passe"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
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
            Registar
          </Button>
        </form>

        <p className="text-sm text-neutral-500 text-center mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

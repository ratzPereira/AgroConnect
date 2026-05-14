import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Tractor,
  Wheat,
} from 'lucide-react';
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

const glassCard = {
  background: 'rgba(255, 255, 255, 0.45)',
  backdropFilter: 'blur(20px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.5)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
} as const;

export function Register() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      await registerApi(request);
      setSuccess(true);
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

  if (success) {
    return (
      <div
        className="min-h-svh flex items-center justify-center px-4 py-10"
        style={{
          backgroundImage: 'url(/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ background: 'rgba(0,20,5,0.25)' }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="relative z-10 w-full rounded-3xl p-8 sm:p-10 text-center"
          style={{ maxWidth: 440, ...glassCard }}
        >
          <div className="mx-auto mb-6 flex items-center justify-center w-20 h-20 rounded-full" style={{ background: 'rgba(240,253,244,0.8)' }}>
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1
            className="font-display text-2xl font-bold mb-3 tracking-tight"
            style={{ color: '#1a1a1a', textShadow: '0 1px 2px rgba(255,255,255,0.4)' }}
          >
            Verifique o seu email
          </h1>
          <p className="text-sm mb-8 leading-relaxed max-w-xs mx-auto" style={{ color: '#404040' }}>
            Enviámos um link de verificação para o seu email. Verifique a sua caixa de correio para ativar a conta.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-semibold text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Ir para o login
          </Link>
        </motion.div>
      </div>
    );
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
      {/* Light overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'rgba(0,20,5,0.25)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full rounded-3xl p-8 sm:p-10"
        style={{ maxWidth: 440, ...glassCard }}
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
          Criar conta
        </h1>
        <p className="text-base mt-2 mb-8" style={{ color: '#404040' }}>
          Comece a usar o AgroConnect em poucos minutos.
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
          {/* Role selection */}
          <div className="mb-5">
            <span className="block text-sm font-medium mb-2.5" style={{ color: '#374151' }}>Tipo de conta</span>
            <div className="grid grid-cols-2 gap-3">
              <label
                className="relative flex flex-col items-center gap-2.5 rounded-xl border-2 px-4 py-5 text-sm font-medium cursor-pointer transition-all"
                style={
                  selectedRole === 'CLIENT'
                    ? { borderColor: '#22c55e', background: 'rgba(240, 253, 244, 0.8)', color: '#15803d' }
                    : { borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255, 255, 255, 0.35)', color: '#525252' }
                }
              >
                <input type="radio" value="CLIENT" className="sr-only" {...register('role')} />
                <div
                  className="p-2 rounded-lg"
                  style={{ background: selectedRole === 'CLIENT' ? 'rgba(220, 252, 231, 0.9)' : 'rgba(255, 255, 255, 0.4)' }}
                >
                  <Wheat className="w-5 h-5" />
                </div>
                Agricultor
              </label>
              <label
                className="relative flex flex-col items-center gap-2.5 rounded-xl border-2 px-4 py-5 text-sm font-medium cursor-pointer transition-all"
                style={
                  selectedRole === 'PROVIDER_MANAGER'
                    ? { borderColor: '#22c55e', background: 'rgba(240, 253, 244, 0.8)', color: '#15803d' }
                    : { borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255, 255, 255, 0.35)', color: '#525252' }
                }
              >
                <input type="radio" value="PROVIDER_MANAGER" className="sr-only" {...register('role')} />
                <div
                  className="p-2 rounded-lg"
                  style={{ background: selectedRole === 'PROVIDER_MANAGER' ? 'rgba(220, 252, 231, 0.9)' : 'rgba(255, 255, 255, 0.4)' }}
                >
                  <Tractor className="w-5 h-5" />
                </div>
                Prestador
              </label>
            </div>
            {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role.message}</p>}
          </div>

          <div className="mb-5">
            <Input
              id="name"
              label="Nome"
              placeholder="João Silva"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

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

          {selectedRole === 'PROVIDER_MANAGER' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-5">
                <Input
                  id="companyName"
                  label="Nome da Empresa"
                  placeholder="AgroServiços Lda"
                  error={errors.companyName?.message}
                  {...register('companyName')}
                />
              </div>
              <div className="mb-5">
                <Input
                  id="nif"
                  label="NIF"
                  placeholder="123456789"
                  error={errors.nif?.message}
                  {...register('nif')}
                />
              </div>
            </motion.div>
          )}

          <div className="mb-5">
            <Input
              id="password"
              label="Palavra-passe"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div className="mb-8">
            <Input
              id="confirmPassword"
              label="Confirmar palavra-passe"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
            Criar conta
          </Button>
        </form>

        <p className="text-sm text-center mt-8" style={{ color: '#404040' }}>
          Já tem conta?{' '}
          <Link to="/login" className="text-green-700 hover:text-green-800 font-semibold transition-colors">
            Entrar
          </Link>
        </p>

        <p className="text-xs text-center mt-5 leading-relaxed" style={{ color: '#737373' }}>
          Ao registar-se, concorda com os{' '}
          <Link to="/terms" className="underline hover:text-neutral-600 transition-colors">Termos de Serviço</Link>
          {' '}e a{' '}
          <Link to="/privacy" className="underline hover:text-neutral-600 transition-colors">Política de Privacidade</Link>.
        </p>
      </motion.div>
    </div>
  );
}

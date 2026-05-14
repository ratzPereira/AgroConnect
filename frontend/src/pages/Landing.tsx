import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  FileText,
  MessageSquare,
  CheckCircle,
  Shield,
  MapPin,
  MessageCircle,
  Star,
  Users,
  Navigation,
  ShoppingBag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

/* ── Animation variants ── */

const STAGGER_DELAY = 0.08;
const ITEM_DURATION = 0.25;

function useStaggerVariants() {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion;

  const container = {
    hidden: {},
    visible: {
      transition: { staggerChildren: shouldAnimate ? STAGGER_DELAY : 0 },
    },
  };

  const item = {
    hidden: shouldAnimate ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'tween' as const, ease: 'easeOut' as const, duration: ITEM_DURATION },
    },
  };

  return { container, item, shouldAnimate };
}

/* ── Data ── */

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: FileText,
    title: 'Publique o seu pedido',
    description: 'Descreva o serviço que precisa, a localização e as datas pretendidas.',
  },
  {
    icon: MessageSquare,
    title: 'Receba propostas',
    description: 'Prestadores qualificados na sua zona enviam propostas com preço e prazo.',
  },
  {
    icon: CheckCircle,
    title: 'Trabalho concluído',
    description: 'Acompanhe a execução, confirme a conclusão e avalie o prestador.',
  },
];

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Shield,
    title: 'Pagamento seguro',
    description: 'O valor é retido em escrow até confirmar a conclusão do serviço.',
  },
  {
    icon: MapPin,
    title: 'Cobertura nos Açores',
    description: 'Prestadores nas 9 ilhas. Encontre quem está mais perto de si.',
  },
  {
    icon: MessageCircle,
    title: 'Chat em tempo real',
    description: 'Comunique diretamente com o prestador durante todo o processo.',
  },
  {
    icon: Star,
    title: 'Avaliações verificadas',
    description: 'Sistema bilateral de avaliações para garantir qualidade e confiança.',
  },
  {
    icon: Users,
    title: 'Gestão de equipa',
    description: 'Prestadores gerem equipas, máquinas e inventário num backoffice dedicado.',
  },
  {
    icon: Navigation,
    title: 'Acompanhamento GPS',
    description: 'Check-in com geolocalização para comprovar a presença no terreno.',
  },
  {
    icon: ShoppingBag,
    title: 'Marketplace de produtos',
    description: 'Compre e venda produtos agrícolas, animais, sementes e equipamento diretamente entre produtores.',
  },
];

interface StatConfig {
  value: number;
  suffix?: string;
  label: string;
}

const STATS: StatConfig[] = [
  { value: 9, label: 'Ilhas Cobertas' },
  { value: 15, suffix: '+', label: 'Categorias de Serviço' },
  { value: 100, suffix: '%', label: 'Pagamento Seguro' },
];

/* ── Stat counter component ── */

interface StatItemProps {
  readonly config: StatConfig;
  readonly animate: boolean;
}

function StatItem({ config, animate }: StatItemProps) {
  const target = animate ? config.value : 0;
  const count = useAnimatedCounter(target, { duration: 1200 });

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-4xl font-bold text-green-700">
        {count}
        {config.suffix ?? ''}
      </span>
      <span className="text-sm text-green-600">{config.label}</span>
    </div>
  );
}

/* ── Main component ── */

export function Landing() {
  const { container, item, shouldAnimate } = useStaggerVariants();

  /* Stats section in-view tracking */
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.4 });
  const [statsTriggered, setStatsTriggered] = useState(false);

  if (statsInView && !statsTriggered) {
    setStatsTriggered(true);
  }

  return (
    <div>
      <SEOHead
        title="AgroConnect — Marketplace de Serviços Agrícolas nos Açores"
        description="Encontre prestadores de serviços agrícolas nos Açores. Lavoura, pulverização, jardinagem e mais."
        path="/landing"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'AgroConnect',
          url: 'https://agroconnect.pt',
          description: 'Marketplace de serviços agrícolas nos Açores',
          logo: 'https://agroconnect.pt/pwa-512x512.png',
        }}
      />
      {/* ── Section 1: Hero ── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          minHeight: '80vh',
          backgroundImage: 'url(/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      >
        {/* Dark gradient overlay for text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(0,20,5,0.75) 0%, rgba(0,20,5,0.55) 50%, rgba(0,20,5,0.3) 100%)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
            style={{ maxWidth: 640 }}
          >
            <motion.h1
              variants={item}
              className="text-4xl lg:text-6xl font-display font-bold text-white leading-tight"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
            >
              Serviços agrícolas ao alcance de um clique
            </motion.h1>
            <motion.p
              variants={item}
              className="text-lg text-white font-medium"
              style={{ maxWidth: 520, textShadow: '0 1px 8px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.3)' }}
            >
              Ligue-se aos melhores prestadores de serviços agrícolas nos Açores.
              Publique o seu pedido, receba propostas e acompanhe tudo numa única plataforma.
            </motion.p>
            <motion.div variants={item} className="flex flex-wrap gap-4 mt-2">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-green-700 transition-colors hover:bg-green-50"
                style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
              >
                Criar Conta
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center rounded-lg border-2 border-white/50 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/15"
              >
                Saber Mais
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Section 2: Como Funciona ── */}
      <section id="como-funciona" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={shouldAnimate ? { opacity: 0, y: 12 } : { opacity: 1 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
            className="text-3xl font-semibold text-center text-neutral-900 mb-14"
          >
            Como funciona
          </motion.h2>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8"
          >
            {/* Dashed connector line (desktop only) */}
            <div
              className="hidden md:block absolute top-7 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] border-t-2 border-dashed border-green-200"
              aria-hidden="true"
            />

            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  variants={item}
                  className="relative flex flex-col items-center text-center gap-4"
                >
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-neutral-900">{step.title}</h3>
                  <p className="text-sm text-neutral-600 max-w-xs">{step.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Section 3: Funcionalidades ── */}
      <section id="funcionalidades" className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={shouldAnimate ? { opacity: 0, y: 12 } : { opacity: 1 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
            className="text-3xl font-semibold text-center text-neutral-900 mb-14"
          >
            Tudo o que precisa numa única plataforma
          </motion.h2>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={item}
                  className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-green-50 text-green-600 mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-neutral-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Section 4: Números ── */}
      <section className="bg-green-50 py-16" ref={statsRef}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-12">
            {STATS.map((stat) => (
              <StatItem key={stat.label} config={stat} animate={statsTriggered} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: CTA Final ── */}
      <section className="bg-gradient-to-r from-green-600 to-green-500 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 12 } : { opacity: 1 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
            className="flex flex-col items-center gap-6"
          >
            <h2 className="text-3xl font-display font-bold text-white">
              Pronto para começar?
            </h2>
            <p className="text-green-100 max-w-lg">
              Junte-se à AgroConnect e transforme a forma como gere os seus serviços agrícolas.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-green-700 transition-colors hover:bg-green-50"
            >
              Criar Conta Grátis
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

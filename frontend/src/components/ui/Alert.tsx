import { useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type AlertVariant = 'success' | 'warning' | 'danger' | 'info';

interface AlertProps {
  readonly variant?: AlertVariant;
  readonly title?: string;
  readonly children: ReactNode;
  readonly dismissible?: boolean;
  readonly onDismiss?: () => void;
  readonly className?: string;
}

interface VariantConfig {
  icon: typeof Info;
  bg: string;
  border: string;
  iconColor: string;
  titleColor: string;
  textColor: string;
}

const variantConfig: Record<AlertVariant, VariantConfig> = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-leaf-50',
    border: 'border-leaf-200',
    iconColor: 'text-leaf-600',
    titleColor: 'text-leaf-800',
    textColor: 'text-leaf-700',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning-50',
    border: 'border-warning-100',
    iconColor: 'text-warning-600',
    titleColor: 'text-warning-800',
    textColor: 'text-warning-600',
  },
  danger: {
    icon: XCircle,
    bg: 'bg-danger-50',
    border: 'border-danger-100',
    iconColor: 'text-danger-600',
    titleColor: 'text-danger-800',
    textColor: 'text-danger-700',
  },
  info: {
    icon: Info,
    bg: 'bg-secondary-50',
    border: 'border-secondary-200',
    iconColor: 'text-secondary-600',
    titleColor: 'text-secondary-800',
    textColor: 'text-secondary-700',
  },
};

export function Alert({ variant = 'info', title, children, dismissible, onDismiss, className }: AlertProps) {
  const [visible, setVisible] = useState(true);
  const config = variantConfig[variant];
  const Icon = config.icon;

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-lg border p-4',
        config.bg,
        config.border,
        className,
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <p className={cn('text-sm font-semibold mb-1', config.titleColor)}>{title}</p>}
        <p className={cn('text-sm', config.textColor)}>{children}</p>
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors duration-150"
          aria-label="Fechar"
        >
          <X className="h-4 w-4 text-neutral-500" />
        </button>
      )}
    </div>
  );
}

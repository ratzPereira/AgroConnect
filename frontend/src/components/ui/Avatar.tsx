import { useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarStatus = 'online' | 'offline' | 'busy';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const statusDotSize: Record<AvatarSize, string> = {
  xs: 'h-1.5 w-1.5 border',
  sm: 'h-2 w-2 border-[1.5px]',
  md: 'h-2.5 w-2.5 border-2',
  lg: 'h-3 w-3 border-2',
  xl: 'h-3.5 w-3.5 border-2',
};

const statusColors: Record<AvatarStatus, string> = {
  online: 'bg-leaf-500',
  offline: 'bg-neutral-400',
  busy: 'bg-warning-400',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({ src, alt, name, size = 'md', status, className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = src && !imgError;
  const initials = name ? getInitials(name) : '?';

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-medium',
          sizeStyles[size],
          showImage ? '' : 'bg-primary-100 text-primary-700',
        )}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name || ''}
            onError={() => setImgError(true)}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white',
            statusDotSize[size],
            statusColors[status],
          )}
        />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  children: ReactNode;
  max?: number;
  className?: string;
}

export function AvatarGroup({ children, max, className }: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const visible = max ? childArray.slice(0, max) : childArray;
  const overflow = max ? childArray.length - max : 0;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visible.map((child, i) => (
        <div key={i} className="ring-2 ring-white rounded-full">
          {child}
        </div>
      ))}
      {overflow > 0 && (
        <div className="h-10 w-10 rounded-full bg-neutral-200 text-neutral-600 text-sm font-medium flex items-center justify-center ring-2 ring-white">
          +{overflow}
        </div>
      )}
    </div>
  );
}

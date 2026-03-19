import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'block w-full rounded-lg border px-3 py-2 text-sm transition-colors',
            'placeholder:text-neutral-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-neutral-300 focus:ring-green-500',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

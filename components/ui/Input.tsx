import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  inputSize?: 'sm' | 'md' | 'lg';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    description,
    error,
    icon: Icon,
    iconPosition = 'left',
    inputSize = 'md',
    id,
    required,
    ...props
  }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const baseClasses = 'w-full rounded-md border bg-white text-slate-900 shadow-card transition-all duration-200 focus:outline-none';

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-bold text-slate-700">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        {description && (
          <p className="mb-2 text-xs text-slate-500">{description}</p>
        )}

        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon className={iconSizes[inputSize]} />
            </div>
          )}

          <input
            type={type}
            id={inputId}
            ref={ref}
            required={required}
            className={cn(
              baseClasses,
              sizes[inputSize],
              'border-slate-200 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100',
              Icon && iconPosition === 'left' && 'pl-10',
              Icon && iconPosition === 'right' && 'pr-10',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
              className
            )}
            {...props}
          />

          {Icon && iconPosition === 'right' && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon className={iconSizes[inputSize]} />
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };

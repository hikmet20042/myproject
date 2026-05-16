import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'add'
    | 'gradient-blue'
    | 'gradient-green'
    | 'white-on-dark';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: 'scale' | 'lift' | 'glow' | 'none';
  gradient?: 'blue' | 'green';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon: Icon,
    iconPosition = 'left',
    fullWidth = false,
    rounded = 'md',
    shadow = 'sm',
    hoverEffect = 'scale',
    gradient,
    children,
    disabled,
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap font-bold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const gradientAliases = {
      blue: 'border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200',
      green: 'border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-200',
    };

    const variants = {
      primary: 'border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-200',
      secondary: 'border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-200',
      outline: 'border border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-600 focus:ring-blue-200',
      ghost: 'border border-transparent bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-200',
      danger: 'border border-transparent bg-red-600 text-white hover:bg-red-700 focus:ring-red-200',
      add: 'border border-dashed border-slate-300 bg-slate-50/40 text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 focus:ring-blue-200',
      'gradient-blue': gradientAliases.blue,
      'gradient-green': gradientAliases.green,
      'white-on-dark': 'border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20 focus:ring-white/30',
    };

    const sizes = {
      xs: 'h-8 px-3 text-xs',
      sm: 'h-9 px-3.5 text-sm',
      md: 'h-10 px-5 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    const roundedClasses = {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-md',
      xl: 'rounded-xl',
      full: 'rounded-full',
    };

    const shadowClasses = {
      none: '',
      sm: 'shadow-card',
      md: 'shadow-md',
      lg: 'shadow-elevated',
    };

    const hoverEffects = {
      scale: 'hover:scale-[1.02] active:scale-[0.98]',
      lift: 'hover:-translate-y-0.5 active:translate-y-0',
      glow: 'hover:shadow-lg',
      none: '',
    };

    const iconSizes = {
      xs: 'w-3.5 h-3.5',
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(
          baseClasses,
          gradient ? gradientAliases[gradient] : variants[variant],
          sizes[size],
          roundedClasses[rounded],
          shadowClasses[shadow],
          hoverEffects[hoverEffect],
          fullWidth && 'w-full',
          className
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className={cn(iconSizes[size], "animate-spin rounded-full border-2 border-current border-t-transparent")} />
            {children && <span>{children}</span>}
          </div>
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className={cn(iconSizes[size], children && 'mr-2')} />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className={cn(iconSizes[size], children && 'ml-2')} />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

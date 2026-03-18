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
    | 'gradient-indigo'
    | 'gradient-purple'
    | 'gradient-pink'
    | 'gradient-teal'
    | 'white-on-dark';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverEffect?: 'scale' | 'lift' | 'glow' | 'none';
  gradient?: 'blue' | 'green' | 'indigo' | 'purple' | 'pink' | 'teal' | 'orange';
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
    rounded = 'xl',
    shadow = 'md',
    hoverEffect = 'scale',
    gradient,
    children,
    disabled,
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const gradientAliases = {
      blue: 'border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200',
      green: 'border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-200',
      indigo: 'border border-cyan-600 bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-200',
      purple: 'border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200',
      pink: 'border border-cyan-600 bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-200',
      teal: 'border border-teal-600 bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-200',
      orange: 'border border-amber-600 bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-200',
    };
    
    const variants = {
      primary: 'border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200',
      secondary: 'border border-blue-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 focus:ring-blue-100',
      outline: 'border border-blue-300 bg-white text-blue-700 hover:border-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-200',
      ghost: 'border border-transparent bg-transparent text-gray-600 hover:bg-blue-50 hover:text-blue-700 focus:ring-blue-100',
      danger: 'border border-transparent bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-200',
      add: 'border border-dashed border-blue-300 bg-blue-50/40 text-blue-700 hover:border-blue-400 hover:bg-blue-50 focus:ring-blue-200',
      'gradient-blue': gradientAliases.blue,
      'gradient-green': gradientAliases.green,
      'gradient-indigo': gradientAliases.indigo,
      'gradient-purple': gradientAliases.purple,
      'gradient-pink': gradientAliases.pink,
      'gradient-teal': gradientAliases.teal,
      'white-on-dark': 'border border-white bg-white text-blue-900 hover:border-blue-100 hover:bg-blue-100 focus:ring-blue-100',
    };
    
    const sizes = {
      xs: 'px-3 py-1.5 text-xs',
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
      xl: 'px-12 py-5 text-xl'
    };
    
    const roundedClasses = {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    };
    
    const shadowClasses = {
      none: '',
      sm: 'shadow-sm hover:shadow',
      md: 'shadow-md hover:shadow-lg',
      lg: 'shadow-lg hover:shadow-xl',
      xl: 'shadow-xl hover:shadow-xl',
    };
    
    const hoverEffects = {
      scale: 'hover:scale-[1.02] active:scale-[0.98]',
      lift: 'hover:-translate-y-1',
      glow: 'hover:shadow-xl',
      none: '',
    };
    
    const iconSizes = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-5 h-5',
      xl: 'w-6 h-6'
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
          <div className="flex items-center space-x-2">
            <div className={cn(iconSizes[size], "border-2 border-current border-t-transparent rounded-full animate-spin")} />
            {children && <span>{children}</span>}
          </div>
        ) : (
          <>
            {Icon && iconPosition === 'left' && (
              <Icon className={cn(iconSizes[size], children && 'mr-2')} />
            )}
            {children}
            {Icon && iconPosition === 'right' && (
              <Icon className={cn(iconSizes[size], children && 'ml-2')} />
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
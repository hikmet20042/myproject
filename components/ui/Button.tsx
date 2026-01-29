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
    const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed';
    
    // Gradient color schemes
    const gradients = {
      blue: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white',
      green: 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white',
      indigo: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white',
      purple: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white',
      pink: 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white',
      teal: 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white',
      orange: 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white',
    };
    
    const variants = {
      primary: 'text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-200 border-2 border-transparent',
      secondary: 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-200',
      outline: 'text-blue-600 border-2 border-blue-600 bg-white hover:bg-blue-600 hover:text-white focus:ring-blue-200',
      ghost: 'text-gray-600 bg-transparent hover:bg-gray-100 focus:ring-gray-200 border-2 border-transparent',
      danger: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-200 border-2 border-transparent',
      add: 'text-indigo-600 border-2 border-dashed border-indigo-300 bg-white hover:border-indigo-400 hover:bg-indigo-50 focus:ring-indigo-200',
      'gradient-blue': `${gradients.blue} focus:ring-blue-200 border-2 border-transparent`,
      'gradient-green': `${gradients.green} focus:ring-green-200 border-2 border-transparent`,
      'gradient-indigo': `${gradients.indigo} focus:ring-indigo-200 border-2 border-transparent`,
      'gradient-purple': `${gradients.purple} focus:ring-purple-200 border-2 border-transparent`,
      'gradient-pink': `${gradients.pink} focus:ring-pink-200 border-2 border-transparent`,
      'gradient-teal': `${gradients.teal} focus:ring-teal-200 border-2 border-transparent`,
      'white-on-dark': 'text-gray-900 bg-white border-2 border-white hover:bg-yellow-300 hover:border-yellow-300 focus:ring-yellow-200',
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
      xl: 'shadow-xl hover:shadow-2xl',
    };
    
    const hoverEffects = {
      scale: 'hover:scale-105 active:scale-95',
      lift: 'hover:-translate-y-1',
      glow: 'hover:shadow-2xl',
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
    
    // Use gradient prop if provided, otherwise use variant
    const buttonVariant = gradient ? gradients[gradient] : variants[variant];
    
    return (
      <button
        className={cn(
          baseClasses,
          gradient ? `${gradients[gradient]} focus:ring-${gradient}-200 border-2 border-transparent` : variants[variant],
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
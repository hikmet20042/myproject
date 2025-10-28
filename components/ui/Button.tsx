import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'add';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
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
    children,
    disabled,
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'text-white bg-gradient-to-r from-primary to-blue-700 hover:from-blue-600 hover:to-blue-800 focus:ring-blue-100 shadow-lg hover:shadow-xl border-2 border-transparent',
      secondary: 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-100',
      outline: 'text-primary border-2 border-primary bg-white hover:bg-primary hover:text-white focus:ring-blue-100',
      ghost: 'text-gray-600 bg-transparent hover:bg-gray-100 focus:ring-gray-100 border-2 border-transparent',
      danger: 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-100 border-2 border-transparent',
      add: 'text-indigo-600 border-2 border-dashed border-indigo-300 bg-white hover:border-indigo-400 hover:bg-indigo-50 focus:ring-indigo-100'
    };
    
    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
      xl: 'px-12 py-4 text-lg'
    };
    
    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-5 h-5',
      xl: 'w-5 h-5'
    };
    
    const isDisabled = disabled || loading;
    
    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
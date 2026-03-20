import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dismissible?: boolean;
  onDismiss?: () => void;
  title?: string;
  icon?: boolean;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({
    className,
    variant = 'info',
    size = 'md',
    dismissible = false,
    onDismiss,
    title,
    icon = true,
    children,
    ...props
  }, ref) => {
    const baseClasses = 'rounded-2xl border shadow-sm transition-colors duration-200';
    
    const variants = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-rose-50 border-rose-200 text-rose-800',
      warning: 'bg-amber-50 border-amber-200 text-amber-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    
    const sizes = {
      sm: 'p-3 text-sm',
      md: 'p-4 text-sm',
      lg: 'p-5 text-base'
    };
    
    const icons = {
      success: CheckCircle,
      error: XCircle,
      warning: AlertCircle,
      info: Info
    };
    
    const iconColors = {
      success: 'text-green-600',
      error: 'text-rose-600',
      warning: 'text-amber-600',
      info: 'text-blue-600'
    };
    
    const IconComponent = icons[variant];
    
    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          {icon && (
            <div className={cn('mt-0.5 flex-shrink-0', iconColors[variant])}>
              <IconComponent className={size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'} />
            </div>
          )}
          
          <div className="flex-1">
            {title && (
              <h4 className={cn(
                'mb-1 font-semibold text-gray-900',
                size === 'sm' ? 'text-sm' : size === 'md' ? 'text-sm' : 'text-base'
              )}>
                {title}
              </h4>
            )}
            
            <div className={cn(
              'leading-relaxed',
              title && 'text-sm opacity-90'
            )}>
              {children}
            </div>
          </div>
          
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className={cn(
                'ml-2 flex-shrink-0 rounded-full p-1 transition-colors duration-200 hover:bg-black/5',
                iconColors[variant]
              )}
            >
              <X className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert };
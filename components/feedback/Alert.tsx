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
    const baseClasses = 'rounded-xl border-2 transition-all duration-200';
    
    const variants = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    
    const sizes = {
      sm: 'p-3 text-sm',
      md: 'p-4 text-base',
      lg: 'p-6 text-lg'
    };
    
    const icons = {
      success: CheckCircle,
      error: XCircle,
      warning: AlertCircle,
      info: Info
    };
    
    const iconColors = {
      success: 'text-green-600',
      error: 'text-blue-600',
      warning: 'text-yellow-600',
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
        <div className="flex items-start">
          {icon && (
            <div className={cn('flex-shrink-0 mr-3', iconColors[variant])}>
              <IconComponent className={size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'} />
            </div>
          )}
          
          <div className="flex-1">
            {title && (
              <h4 className={cn(
                'font-semibold mb-1',
                size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
              )}>
                {title}
              </h4>
            )}
            
            <div className={cn(
              title && 'text-sm opacity-90'
            )}>
              {children}
            </div>
          </div>
          
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className={cn(
                'flex-shrink-0 ml-3 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors duration-200',
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
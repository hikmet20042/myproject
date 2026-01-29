import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'orange' | 'indigo' | 'purple';
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
    variant = 'default',
    inputSize = 'md',
    id,
    required,
    ...props
  }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    const baseClasses = 'w-full border-2 rounded-xl transition-all duration-200 focus:outline-none';
    
    const variants = {
      default: 'border-gray-200 focus:ring-4 focus:ring-gray-100 focus:border-gray-500',
      orange: 'border-gray-200 focus:ring-4 focus:ring-orange-100 focus:border-orange-500',
      indigo: 'border-gray-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500',
      purple: 'border-gray-200 focus:ring-4 focus:ring-purple-100 focus:border-purple-500'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-4 py-2.5 text-base'
    };
    
    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };
    
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {description && (
          <p className="text-xs text-gray-600 mb-2">{description}</p>
        )}
        
        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
              variants[variant],
              sizes[inputSize],
              Icon && iconPosition === 'left' && 'pl-12',
              Icon && iconPosition === 'right' && 'pr-12',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
              className
            )}
            {...props}
          />
          
          {Icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Icon className={iconSizes[inputSize]} />
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
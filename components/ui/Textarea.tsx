import React from 'react';
import { cn } from '@/lib/utils';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
  variant?: 'default' | 'orange' | 'indigo' | 'purple';
  textAreaSize?: 'sm' | 'md' | 'lg';
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({
    className,
    label,
    description,
    error,
    variant = 'default',
    textAreaSize = 'md',
    id,
    required,
    rows = 4,
    ...props
  }, ref) => {
    const textAreaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    const baseClasses = 'w-full border-2 rounded-xl transition-all duration-200 focus:outline-none resize-none';
    
    const variants = {
      default: 'border-gray-200 focus:ring-4 focus:ring-gray-100 focus:border-gray-500',
      orange: 'border-gray-200 focus:ring-4 focus:ring-orange-100 focus:border-orange-500',
      indigo: 'border-gray-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500',
      purple: 'border-gray-200 focus:ring-4 focus:ring-purple-100 focus:border-purple-500'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3.5 py-2 text-sm',
      lg: 'px-4 py-2.5 text-base'
    };
    
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textAreaId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {description && (
          <p className="text-xs text-gray-600 mb-2">{description}</p>
        )}
        
        <textarea
          id={textAreaId}
          ref={ref}
          required={required}
          rows={rows}
          className={cn(
            baseClasses,
            variants[variant],
            sizes[textAreaSize],
            error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
            className
          )}
          {...props}
        />
        
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export { TextArea };
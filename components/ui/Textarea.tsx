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
    
    const baseClasses = 'w-full resize-none rounded-xl border bg-white text-gray-900 shadow-sm transition-all duration-200 focus:outline-none';
    
    const variants = {
      default: 'border-blue-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-100',
      orange: 'border-emerald-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100',
      indigo: 'border-blue-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-100',
      purple: 'border-cyan-100 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100'
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
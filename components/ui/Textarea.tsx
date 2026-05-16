import React from 'react';
import { cn } from '@/lib/utils';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
  textAreaSize?: 'sm' | 'md' | 'lg';
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({
    className,
    label,
    description,
    error,
    textAreaSize = 'md',
    id,
    required,
    rows = 4,
    ...props
  }, ref) => {
    const textAreaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    const baseClasses = 'w-full resize-none rounded-md border bg-white text-slate-900 shadow-card transition-all duration-200 focus:outline-none';
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3.5 py-2 text-sm',
      lg: 'px-4 py-2.5 text-base'
    };
    
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textAreaId} className="block text-sm font-bold text-slate-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {description && (
          <p className="text-xs text-slate-500 mb-2">{description}</p>
        )}
        
        <textarea
          id={textAreaId}
          ref={ref}
          required={required}
          rows={rows}
          className={cn(
            baseClasses,
            'border-slate-200 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100',
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
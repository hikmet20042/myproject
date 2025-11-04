import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  variant?: 'default' | 'orange' | 'indigo' | 'purple';
  selectSize?: 'sm' | 'md' | 'lg';
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    label,
    description,
    error,
    options,
    placeholder = 'Select an option...',
    variant = 'default',
    selectSize = 'md',
    id,
    required,
    ...props
  }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    const baseClasses = 'w-full border-2 rounded-xl transition-all duration-200 focus:outline-none appearance-none bg-white cursor-pointer';
    
    const variants = {
      default: 'border-gray-200 focus:ring-4 focus:ring-gray-100 focus:border-gray-500',
      orange: 'border-gray-200 focus:ring-4 focus:ring-orange-100 focus:border-orange-500',
      indigo: 'border-gray-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500',
      purple: 'border-gray-200 focus:ring-4 focus:ring-purple-100 focus:border-purple-500'
    };
    
    const sizes = {
      sm: 'px-3 py-2 pr-10 text-sm',
      md: 'px-4 py-3 pr-12 text-base',
      lg: 'px-4 py-4 pr-12 text-lg'
    };
    
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {description && (
          <p className="text-sm text-gray-600 mb-3">{description}</p>
        )}
        
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            required={required}
            className={cn(
              baseClasses,
              variants[variant],
              sizes[selectSize],
              error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
              className
            )}
            {...props}
          >
            
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
        
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
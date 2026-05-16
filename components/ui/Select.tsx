import React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value' | 'defaultValue'> {
  label?: string;
  description?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  variant?: 'default' | 'orange' | 'indigo' | 'purple';
  selectSize?: 'sm' | 'md' | 'lg';
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
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
    value,
    defaultValue,
    onChange,
    disabled,
    name,
    form,
    autoFocus
  }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const descriptionId = description ? `${selectId}-description` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;
    
    const baseClasses = 'relative inline-flex w-full items-center cursor-pointer rounded-xl border bg-white text-left text-slate-900 shadow-sm transition-all duration-200 focus:outline-none';
    
    const variants = {
      default: 'border-blue-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-100',
      orange: 'border-emerald-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100',
      indigo: 'border-blue-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-100',
      purple: 'border-cyan-100 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100'
    };
    
    const sizes = {
      sm: 'px-3 py-2 pr-10 text-sm',
      md: 'px-4 py-3 pr-12 text-base',
      lg: 'px-4 py-4 pr-12 text-lg'
    };
    
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {description && (
          <p id={descriptionId} className="text-sm text-slate-600 mb-3">{description}</p>
        )}
        
        <div className="relative">
          <RadixSelect.Root
            value={value}
            defaultValue={defaultValue}
            onValueChange={(newValue) => {
              if (onChange) {
                onChange({ target: { value: newValue, name, id: selectId } } as React.ChangeEvent<HTMLSelectElement>)
              }
            }}
            disabled={disabled}
            required={required}
            name={name}
            form={form}
          >
            <RadixSelect.Trigger
              id={selectId}
              ref={ref as unknown as React.Ref<HTMLButtonElement>}
              autoFocus={autoFocus}
              aria-invalid={!!error}
              aria-describedby={cn(descriptionId, errorId)}
              className={cn(
                baseClasses,
                variants[variant],
                sizes[selectSize],
                error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
                className
              )}
            >
              <RadixSelect.Value className="block truncate" placeholder={placeholder} />
              <RadixSelect.Icon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-blue-400">
                <ChevronDown className="h-5 w-5" />
              </RadixSelect.Icon>
            </RadixSelect.Trigger>

            <RadixSelect.Portal>
              <RadixSelect.Content
                position="popper"
                sideOffset={8}
                className="z-50 max-h-60 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-blue-100 bg-white shadow-md"
              >
                <RadixSelect.Viewport className="p-1">
                  {options.map((option) => (
                    <RadixSelect.Item
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className="relative flex select-none items-center rounded-md py-2 pl-8 pr-2 text-sm text-slate-700 outline-none focus:bg-blue-50 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                    >
                      <RadixSelect.ItemIndicator className="absolute left-2 inline-flex items-center">
                        <Check className="h-4 w-4 text-blue-600" />
                      </RadixSelect.ItemIndicator>
                      <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                    </RadixSelect.Item>
                  ))}
                </RadixSelect.Viewport>
              </RadixSelect.Content>
            </RadixSelect.Portal>
          </RadixSelect.Root>
        </div>
        
        {error && (
          <p id={errorId} className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
import React from 'react';
import { cn } from '@/lib/utils';
import { Input, InputProps } from '../ui/Input';
import { TextArea, TextAreaProps } from '../ui/Textarea';
import { Select, SelectProps } from '../ui/Select';

export interface FormFieldProps {
  type?: 'input' | 'textarea' | 'select';
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

export type FormInputFieldProps = FormFieldProps & InputProps;
export type FormTextAreaFieldProps = FormFieldProps & TextAreaProps;
export type FormSelectFieldProps = FormFieldProps & SelectProps;

const FormField = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  FormInputFieldProps | FormTextAreaFieldProps | FormSelectFieldProps
>(({ type = 'input', className, spacing = 'md', ...props }, ref) => {
  const spacings = {
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-8'
  };
  
  const wrapperClass = cn(spacings[spacing], className);
  
  if (type === 'textarea') {
    return (
      <div className={wrapperClass}>
        <TextArea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          {...(props as TextAreaProps)}
        />
      </div>
    );
  }
  
  if (type === 'select') {
    return (
      <div className={wrapperClass}>
        <Select
          ref={ref as React.Ref<HTMLSelectElement>}
          {...(props as SelectProps)}
        />
      </div>
    );
  }
  
  return (
    <div className={wrapperClass}>
      <Input
        ref={ref as React.Ref<HTMLInputElement>}
        {...(props as InputProps)}
      />
    </div>
  );
});

FormField.displayName = 'FormField';

export { FormField };
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { LucideIcon } from 'lucide-react';

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: LucideIcon;
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  contentPadding?: 'sm' | 'md' | 'lg' | 'xl';
  spacing?: 'sm' | 'md' | 'lg';
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({
    className,
    title,
    description,
    icon,
    gradient = true,
    gradientFrom = 'primary',
    gradientTo = 'red-800',
    contentPadding = 'lg',
    spacing = 'md',
    children,
    ...props
  }, ref) => {
    const spacings = {
      sm: 'space-y-4',
      md: 'space-y-6',
      lg: 'space-y-8'
    };
    
    return (
      <Card ref={ref} className={cn('mb-8', className)} {...props}>
        <CardHeader
          gradient={gradient}
          gradientFrom={gradientFrom}
          gradientTo={gradientTo}
          icon={icon}
          title={title}
          description={description}
        />
        
        <CardContent padding={contentPadding}>
          <div className={spacings[spacing]}>
            {children}
          </div>
        </CardContent>
      </Card>
    );
  }
);

FormSection.displayName = 'FormSection';

export { FormSection };
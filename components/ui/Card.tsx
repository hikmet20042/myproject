import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient';
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  icon?: LucideIcon;
  title?: string;
  description?: string;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', shadow = 'xl', ...props }, ref) => {
    const baseClasses = 'bg-white rounded-2xl border border-gray-100 overflow-hidden';
    
    const shadows = {
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl'
    };
    
    return (
      <div
        ref={ref}
        className={cn(baseClasses, shadows[shadow], className)}
        {...props}
      />
    );
  }
);

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({
    className,
    gradient = false,
    gradientFrom = 'primary',
    gradientTo = 'red-800',
    icon: Icon,
    title,
    description,
    children,
    ...props
  }, ref) => {
    const baseClasses = 'px-8 py-6';
    const gradientClasses = gradient
      ? `bg-gradient-to-r from-${gradientFrom} to-${gradientTo}`
      : 'bg-white';
    
    return (
      <div
        ref={ref}
        className={cn(baseClasses, gradientClasses, className)}
        {...props}
      >
        {(title || Icon) && (
          <h2 className={cn(
            'text-2xl font-bold flex items-center',
            gradient ? 'text-white' : 'text-gray-900'
          )}>
            {Icon && <Icon className="w-6 h-6 mr-3" />}
            {title}
          </h2>
        )}
        
        {description && (
          <p className={cn(
            'mt-2',
            gradient ? 'text-red-100' : 'text-gray-600'
          )}>
            {description}
          </p>
        )}
        
        {children}
      </div>
    );
  }
);

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding = 'lg', ...props }, ref) => {
    const paddings = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10'
    };
    
    return (
      <div
        ref={ref}
        className={cn(paddings[padding], className)}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardContent };
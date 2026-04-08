import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient';
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
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
  ({ className, variant = 'default', shadow = 'md', interactive = false, ...props }, ref) => {
    const baseClasses = 'brand-card-highlight overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 ease-out';
    
    const shadows = {
      sm: 'shadow-sm',
      md: 'shadow',
      lg: 'shadow-md',
      xl: 'shadow-xl'
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          shadows[shadow],
          interactive && 'transform-gpu hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg',
          className
        )}
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
    const baseClasses = 'px-6 py-6 border-b border-slate-100';
    const gradientMap: Record<string, string> = {
      'primary': 'from-blue-600',
      'blue-600': 'from-blue-600',
      'red-800': 'from-red-800',
      'emerald-600': 'from-emerald-600',
    };
    const toGradientMap: Record<string, string> = {
      'red-800': 'to-red-800',
      'blue-700': 'to-blue-700',
      'emerald-700': 'to-emerald-700',
      'indigo-700': 'to-indigo-700',
    };
    const fromClass = gradientMap[gradientFrom] || 'from-blue-600';
    const toClass = toGradientMap[gradientTo] || 'to-blue-700';
    const gradientClasses = gradient
      ? `bg-gradient-to-r ${fromClass} ${toClass}`
      : 'bg-slate-50';
    
    return (
      <div
        ref={ref}
        className={cn(baseClasses, gradientClasses, className)}
        {...props}
      >
        {(title || Icon) && (
          <h2 className={cn(
            'text-2xl leading-tight font-bold flex items-center',
            gradient ? 'text-white' : 'text-gray-900'
          )}>
            {Icon && <Icon className="w-6 h-6 mr-3" />}
            {title}
          </h2>
        )}
        
        {description && (
          <p className={cn(
            'mt-3 text-sm leading-relaxed',
            gradient ? 'text-blue-100' : 'text-gray-600'
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
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8'
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

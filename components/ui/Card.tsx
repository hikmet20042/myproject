import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: LucideIcon;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', shadow = 'sm', interactive = false, ...props }, ref) => {
    const baseClasses = 'overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200 ease-out';

    const shadows = {
      none: '',
      sm: 'shadow-card',
      md: 'shadow-md',
      lg: 'shadow-elevated',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          shadows[shadow],
          interactive && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover hover:border-blue-200',
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
    icon: Icon,
    title,
    description,
    action,
    gradient = false,
    gradientFrom = 'primary',
    gradientTo = 'red-800',
    children,
    ...props
  }, ref) => {
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
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          'border-b border-slate-100 px-6 py-5',
          gradient && gradientClasses,
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {(title || Icon) && (
              <div className="flex items-center gap-3">
                {Icon && !gradient && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                )}
                {Icon && gradient && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/20 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                )}
                {title && (
                  <h3 className={cn('text-lg font-black', gradient ? 'text-white' : 'text-slate-900')}>
                    {title}
                  </h3>
                )}
              </div>
            )}
            {description && (
              <p className={cn('mt-1.5 text-sm leading-relaxed', gradient ? 'text-blue-100' : 'text-slate-600')}>
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {children}
      </div>
    );
  }
);

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding = 'lg', ...props }, ref) => {
    const paddings = {
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
      xl: 'p-8',
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

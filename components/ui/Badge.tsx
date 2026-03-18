import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  className?: string;
  rounded?: boolean;
}

const badgeVariants = {
  primary: 'border border-blue-200 bg-blue-50 text-blue-700',
  secondary: 'border border-cyan-200 bg-cyan-50 text-cyan-700',
  success: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border border-rose-200 bg-rose-50 text-rose-700',
  info: 'border border-sky-200 bg-sky-50 text-sky-700'
};

const badgeSizes = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-2'
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'sm',
  icon: Icon,
  className,
  rounded = true,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium',
        badgeVariants[variant],
        badgeSizes[size],
        rounded ? 'rounded-full' : 'rounded',
        className
      )}
      {...props}
    >
      {Icon && <Icon className={cn('mr-1', size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5')} />}
      {children}
    </span>
  );
};

export default Badge;
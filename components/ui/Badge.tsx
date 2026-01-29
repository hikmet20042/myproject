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
  primary: 'bg-blue-100 text-blue-800',
  secondary: 'bg-purple-100 text-purple-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800'
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
import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

export interface ContactCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
  variant?: 'default' | 'compact';
}

const ContactCard = React.forwardRef<any, ContactCardProps>(
  ({
    className,
    icon: Icon,
    label,
    value,
    href,
    variant = 'default',
    ...props
  }, ref) => {
    const baseClasses = 'flex items-center rounded-xl transition-colors duration-200';
    
    const variants = {
      default: 'border border-blue-100 bg-blue-50/50 p-3 hover:bg-blue-50',
      compact: 'border border-blue-100 bg-white p-2 hover:border-blue-200 hover:bg-blue-50/30'
    };
    
    const iconVariants = {
      default: 'mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white',
      compact: 'mr-2 h-6 w-6 text-blue-600'
    };
    
    const content = (
      <>
        <div className={iconVariants[variant]}>
          <Icon className={variant === 'default' ? 'h-4 w-4 text-white' : 'h-4 w-4'} />
        </div>
        <div className="flex-1">
          <p className={cn(
            'font-medium text-gray-500',
            variant === 'default' ? 'text-xs' : 'text-sm'
          )}>
            {label}
          </p>
          <p className={cn(
            'font-medium break-all',
            variant === 'default' ? 'text-gray-900 hover:text-blue-700' : 'text-gray-700'
          )}>
            {value}
          </p>
        </div>
      </>
    );
    
    if (href) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cn(
            baseClasses,
            variants[variant],
            'cursor-pointer',
            className
          )}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </Link>
      );
    }
    
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          baseClasses,
          variants[variant],
          className
        )}
        {...props}
      >
        {content}
      </div>
    );
  }
);

ContactCard.displayName = 'ContactCard';

export { ContactCard };
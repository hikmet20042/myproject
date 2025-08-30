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
    const baseClasses = 'flex items-center rounded-lg transition-colors duration-200';
    
    const variants = {
      default: 'p-3 bg-gray-50 hover:bg-gray-100',
      compact: 'p-2 bg-white border border-gray-200 hover:border-gray-300'
    };
    
    const iconVariants = {
      default: 'w-8 h-8 bg-accent rounded-lg flex items-center justify-center mr-3',
      compact: 'w-6 h-6 text-gray-500 mr-2'
    };
    
    const content = (
      <>
        <div className={iconVariants[variant]}>
          <Icon className={variant === 'default' ? 'w-4 h-4 text-primary' : 'w-4 h-4'} />
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
            variant === 'default' ? 'text-gray-900 hover:text-primary' : 'text-gray-700'
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
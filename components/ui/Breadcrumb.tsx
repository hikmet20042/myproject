import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  variant?: 'default' | 'light';
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({
    className,
    items,
    separator = <ChevronRight className="w-4 h-4" />,
    variant = 'default',
    ...props
  }, ref) => {
    const variants = {
      default: 'text-gray-600',
      light: 'text-white/80'
    };
    
    const linkVariants = {
      default: 'hover:text-gray-900',
      light: 'hover:text-white'
    };
    
    const currentVariants = {
      default: 'text-gray-900',
      light: 'text-white'
    };
    
    return (
      <nav
        ref={ref}
        className={cn('flex items-center space-x-2', variants[variant], className)}
        aria-label="Breadcrumb"
        {...props}
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className={cn('flex-shrink-0', variants[variant])}>
                {separator}
              </span>
            )}
            {item.current || !item.href ? (
              <span className={cn('font-medium', currentVariants[variant])}>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  'transition-colors duration-200',
                  variants[variant],
                  linkVariants[variant]
                )}
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  }
);

Breadcrumb.displayName = 'Breadcrumb';

export { Breadcrumb };
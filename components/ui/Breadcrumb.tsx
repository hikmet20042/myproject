import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  variant?: 'default' | 'light';
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, items, variant = 'default', ...props }, ref) => {
    const containerVariants = {
      default: 'text-slate-500',
      light: 'text-white/80',
    };

    const linkVariants = {
      default: 'hover:text-blue-600',
      light: 'hover:text-white',
    };

    const currentVariants = {
      default: 'text-slate-900',
      light: 'text-white',
    };

    const separatorVariants = {
      default: 'text-slate-300',
      light: 'text-white/40',
    };

    return (
      <nav
        ref={ref}
        className={cn('flex items-center gap-2 text-xs font-bold uppercase tracking-widest', containerVariants[variant], className)}
        aria-label="Breadcrumb"
        {...props}
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className={cn('flex-shrink-0', separatorVariants[variant])} aria-hidden="true">
                /
              </span>
            )}
            {item.current || !item.href ? (
              <span className={cn('font-medium truncate', currentVariants[variant])}>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  'transition-colors duration-200',
                  containerVariants[variant],
                  linkVariants[variant]
                )}
              >
                {index === 0 && <Home className="inline w-3.5 h-3.5 mr-1" />}
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
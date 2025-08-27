import React from 'react';
import { cn } from '@/lib/utils';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  center?: boolean;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({
    className,
    size = 'lg',
    padding = 'md',
    center = true,
    ...props
  }, ref) => {
    const sizes = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full'
    };
    
    const paddings = {
      none: '',
      sm: 'px-4 py-4',
      md: 'px-6 py-6',
      lg: 'px-8 py-8',
      xl: 'px-12 py-12'
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          'w-full',
          sizes[size],
          paddings[padding],
          center && 'mx-auto',
          className
        )}
        {...props}
      />
    );
  }
);

Container.displayName = 'Container';

export { Container };
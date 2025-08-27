import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse';
  color?: 'primary' | 'white' | 'gray' | 'current';
  text?: string;
  fullScreen?: boolean;
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({
    className,
    size = 'md',
    variant = 'spinner',
    color = 'primary',
    text,
    fullScreen = false,
    ...props
  }, ref) => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12'
    };
    
    const colors = {
      primary: 'border-primary border-t-transparent',
      white: 'border-white border-t-transparent',
      gray: 'border-gray-400 border-t-transparent',
      current: 'border-current border-t-transparent'
    };
    
    const textSizes = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl'
    };
    
    const SpinnerComponent = () => (
      <div
        className={cn(
          'border-2 rounded-full animate-spin',
          sizes[size],
          colors[color]
        )}
      />
    );
    
    const DotsComponent = () => (
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full animate-pulse',
              size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5',
              color === 'primary' ? 'bg-primary' : color === 'white' ? 'bg-white' : color === 'gray' ? 'bg-gray-400' : 'bg-current'
            )}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    );
    
    const PulseComponent = () => (
      <div
        className={cn(
          'rounded-full animate-pulse',
          sizes[size],
          color === 'primary' ? 'bg-primary' : color === 'white' ? 'bg-white' : color === 'gray' ? 'bg-gray-400' : 'bg-current'
        )}
      />
    );
    
    const LoadingIcon = () => {
      switch (variant) {
        case 'dots':
          return <DotsComponent />;
        case 'pulse':
          return <PulseComponent />;
        default:
          return <SpinnerComponent />;
      }
    };
    
    const content = (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center',
          text && 'space-x-2',
          fullScreen && 'fixed inset-0 bg-white bg-opacity-75 z-50',
          className
        )}
        {...props}
      >
        <LoadingIcon />
        {text && (
          <span className={cn(
            'font-medium',
            textSizes[size],
            color === 'primary' ? 'text-primary' : color === 'white' ? 'text-white' : color === 'gray' ? 'text-gray-600' : 'text-current'
          )}>
            {text}
          </span>
        )}
      </div>
    );
    
    return content;
  }
);

Loading.displayName = 'Loading';

export { Loading };
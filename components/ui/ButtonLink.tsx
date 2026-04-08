import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: 
    | 'primary' 
    | 'secondary' 
    | 'outline' 
    | 'ghost' 
    | 'danger'
    | 'add'
    | 'gradient-blue'
    | 'gradient-green'
    | 'gradient-indigo'
    | 'gradient-purple'
    | 'gradient-pink'
    | 'gradient-teal'
    | 'white-on-dark';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverEffect?: 'scale' | 'lift' | 'glow' | 'none';
  external?: boolean;
}

export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    fullWidth = false,
    rounded = 'xl',
    shadow = 'md',
    hoverEffect = 'scale',
    external = false,
    children,
    href,
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
    
    const gradientAliases = {
      blue: 'border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200',
      green: 'border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-200',
      indigo: 'border border-cyan-600 bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-200',
      purple: 'border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200',
      pink: 'border border-cyan-600 bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-200',
      teal: 'border border-teal-600 bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-200',
    };
    
    const variants = {
      primary: 'brand-primary-btn border border-transparent text-white focus-visible:ring-blue-200',
      secondary: 'border border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-200',
      outline: 'border border-blue-300 bg-white text-blue-700 hover:border-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-200',
      ghost: 'border border-transparent bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-200',
      danger: 'border border-transparent bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-200',
      add: 'border border-dashed border-blue-300 bg-blue-50/40 text-blue-700 hover:border-blue-400 hover:bg-blue-50 focus:ring-blue-200',
      'gradient-blue': gradientAliases.blue,
      'gradient-green': gradientAliases.green,
      'gradient-indigo': gradientAliases.indigo,
      'gradient-purple': gradientAliases.purple,
      'gradient-pink': gradientAliases.pink,
      'gradient-teal': gradientAliases.teal,
      'white-on-dark': 'border border-white bg-white text-blue-900 hover:border-blue-100 hover:bg-blue-100 focus:ring-blue-100',
    };
    
    const sizes = {
      xs: 'h-8 px-3 text-xs',
      sm: 'h-9 px-3.5 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-5 text-base',
      xl: 'h-12 px-6 text-base'
    };
    
    const roundedClasses = {
      sm: 'rounded-md',
      md: 'rounded-lg',
      lg: 'rounded-xl',
      xl: 'rounded-xl',
      full: 'rounded-full',
    };
    
    const shadowClasses = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow',
      lg: 'shadow-md',
      xl: 'shadow-xl',
    };
    
    const hoverEffects = {
      scale: 'hover:scale-[1.01] active:scale-[0.98]',
      lift: 'hover:-translate-y-0.5 active:translate-y-0',
      glow: 'hover:shadow-xl',
      none: '',
    };
    
    const iconSizes = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-5 h-5',
      xl: 'w-6 h-6'
    };
    
    const content = (
      <>
        {Icon && iconPosition === 'left' && (
          <Icon className={cn(iconSizes[size], children && 'mr-2')} />
        )}
        {children}
        {Icon && iconPosition === 'right' && (
          <Icon className={cn(iconSizes[size], children && 'ml-2')} />
        )}
      </>
    );
    
    const classes = cn(
      baseClasses,
      variants[variant],
      sizes[size],
      roundedClasses[rounded],
      shadowClasses[shadow],
      hoverEffects[hoverEffect],
      fullWidth && 'w-full',
      className
    );
    
    if (external) {
      return (
        <a
          href={href}
          className={classes}
          ref={ref}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {content}
        </a>
      );
    }
    
    return (
      <Link
        href={href}
        className={classes}
        ref={ref}
        {...props}
      >
        {content}
      </Link>
    );
  }
);

ButtonLink.displayName = 'ButtonLink';

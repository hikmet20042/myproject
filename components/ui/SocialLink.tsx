import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface SocialLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'github';
  icon?: LucideIcon;
  label?: string;
  variant?: 'default' | 'compact' | 'icon-only';
}

const SocialLink = React.forwardRef<HTMLAnchorElement, SocialLinkProps>(
  ({
    className,
    platform,
    icon: CustomIcon,
    label,
    variant = 'default',
    children,
    ...props
  }, ref) => {
    const platformConfig = {
      facebook: {
        name: 'Facebook',
        bgColor: 'border border-blue-200 bg-blue-50 hover:bg-blue-100',
        textColor: 'text-blue-700 group-hover:text-blue-800',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )
      },
      twitter: {
        name: 'Twitter',
        bgColor: 'border border-cyan-200 bg-cyan-50 hover:bg-cyan-100',
        textColor: 'text-cyan-700 group-hover:text-cyan-800',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
        )
      },
      instagram: {
        name: 'Instagram',
        bgColor: 'border border-indigo-200 bg-indigo-50 hover:bg-indigo-100',
        textColor: 'text-indigo-700 group-hover:text-indigo-800',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323C6.001 8.198 7.152 7.708 8.449 7.708s2.448.49 3.323 1.416c.875.875 1.365 2.026 1.365 3.323s-.49 2.448-1.365 3.323c-.875.807-2.026 1.218-3.323 1.218zm7.718-1.297c-.875.875-2.026 1.365-3.323 1.365s-2.448-.49-3.323-1.365c-.875-.875-1.365-2.026-1.365-3.323s.49-2.448 1.365-3.323c.875-.875 2.026-1.365 3.323-1.365s2.448.49 3.323 1.365c.875.875 1.365 2.026 1.365 3.323s-.49 2.448-1.365 3.323z"/>
          </svg>
        )
      },
      linkedin: {
        name: 'LinkedIn',
        bgColor: 'border border-blue-200 bg-blue-50 hover:bg-blue-100',
        textColor: 'text-blue-700 group-hover:text-blue-800',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        )
      },
      youtube: {
        name: 'YouTube',
        bgColor: 'border border-rose-200 bg-rose-50 hover:bg-rose-100',
        textColor: 'text-rose-700 group-hover:text-rose-800',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        )
      },
      tiktok: {
        name: 'TikTok',
        bgColor: 'border border-slate-200 bg-slate-50 hover:bg-slate-100',
        textColor: 'text-slate-700 group-hover:text-slate-800',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
        )
      },
      github: {
        name: 'GitHub',
        bgColor: 'border border-slate-200 bg-slate-50 hover:bg-slate-100',
        textColor: 'text-slate-700 group-hover:text-slate-900',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.56 0-.27-.01-1.16-.02-2.1-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.69 1.26 3.35.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.73 0-1.27.45-2.31 1.2-3.12-.12-.29-.52-1.47.12-3.07 0 0 .98-.31 3.2 1.19a11.05 11.05 0 0 1 5.84 0c2.22-1.5 3.2-1.19 3.2-1.19.64 1.6.24 2.78.12 3.07.75.81 1.2 1.85 1.2 3.12 0 4.46-2.7 5.43-5.28 5.72.41.36.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.13 0 .31.2.67.79.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
          </svg>
        )
      }
    };
    
    const config = platformConfig[platform];
    const displayLabel = label || config.name;
    
    const baseClasses = 'inline-flex items-center rounded-md transition-colors duration-200 group';
    
    const variants = {
      default: 'p-3',
      compact: 'p-2',
      'icon-only': 'p-2'
    };
    
    return (
      <a
        ref={ref}
        className={cn(
          baseClasses,
          config.bgColor,
          variants[variant],
          className
        )}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        <div className={config.textColor}>
          {CustomIcon ? <CustomIcon className="w-5 h-5" /> : config.icon}
        </div>
        {variant !== 'icon-only' && (
          <span className={cn(
            'font-medium ml-3',
            config.textColor,
            variant === 'compact' ? 'text-sm' : 'text-sm'
          )}>
            {children || displayLabel}
          </span>
        )}
      </a>
    );
  }
);

SocialLink.displayName = 'SocialLink';

export { SocialLink };

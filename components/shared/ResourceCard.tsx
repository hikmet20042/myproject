'use client';

import { type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

interface ResourceCardProps {
  /** Resource domain type for semantic grouping */
  type: 'event' | 'vacancy' | 'blog' | 'organization' | 'material';
  /** Title of the resource */
  title: string;
  /** Description or subtitle */
  description?: string;
  /** URL to navigate to when clicked */
  href?: string;
  /** Badges to display (categories, tags, etc.) */
  badges?: Array<{
    label: string;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
    colorScheme?: string;
  }>;
  /** Footer content (metadata like date, location, etc.) */
  footer?: ReactNode;
  /** Metadata slot (date, location, author, organization, etc.) */
  metadata?: ReactNode;
  /** Action slot (save/apply/detail buttons, etc.) */
  actions?: ReactNode;
  /** Optional image URL */
  imageUrl?: string;
  /** Custom hover border color */
  hoverBorderColor?: string;
  /** Custom gradient for the card hover effect */
  hoverGradient?: string;
  /** Optional icon to display in the header */
  icon?: ReactNode;
  /** Action button text */
  actionText?: string;
  /** Callback when card is clicked (if no href provided) */
  onClick?: () => void;
  /** Additional className */
  className?: string;
  /** Additional className for card wrapper */
  wrapperClassName?: string;
  /** Optional inline style for wrapper */
  style?: CSSProperties;
  /** Optional top-right slot for badges/icons */
  topRight?: ReactNode;
}

/**
 * Standardized card component for displaying resources
 * Used across vacancies, events, organizations, and materials pages
 */
export function ResourceCard({
  type,
  title,
  description,
  href,
  badges,
  footer,
  metadata,
  actions,
  imageUrl,
  hoverBorderColor = 'hover:border-blue-300',
  hoverGradient = 'group-hover:from-blue-50 group-hover:to-emerald-50',
  icon,
  actionText,
  onClick,
  className = '',
  wrapperClassName = '',
  style,
  topRight,
}: ResourceCardProps) {
  const localePath = useLocalizedPath()
  const content = (
      <Card
        data-resource-type={type}
        className={`h-full border-2 border-gray-200 ${hoverBorderColor} hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${className}`}
      >
        <CardContent className={`relative p-6 h-full flex flex-col bg-gradient-to-br from-white to-gray-50 ${hoverGradient} transition-all duration-300`}>
          {topRight && (
            <div className="absolute right-6 top-6 z-20">
              {topRight}
            </div>
          )}
          {/* Image */}
          {imageUrl && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <Image
                src={imageUrl}
                alt={title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                width={640}
                height={384}
              />
            </div>
          )}

          {/* Header with Icon */}
          {icon && (
            <div className="mb-3">
              {icon}
            </div>
          )}

          {/* Badges */}
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {badges.map((badge, idx) => (
                <Badge
                  key={idx}
                  variant={badge.variant || 'primary'}
                  className="text-xs"
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-gray-600 mb-4 flex-1 line-clamp-3">
              {description}
            </p>
          )}

          {metadata && (
            <div className="space-y-2 mb-4 flex-1">
              {metadata}
            </div>
          )}

          {/* Footer */}
          {footer && (
            <div className="mt-auto pt-4 border-t border-gray-200">
              {footer}
            </div>
          )}

          {actions && (
            <div className="pt-4 border-t border-gray-200 mt-auto">
              {actions}
            </div>
          )}

          {/* Action Button */}
          {actionText && !actions && (
            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300"
              >
                {actionText}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
  );

  if (href) {
    return (
      <Link href={href.startsWith('/') ? localePath(href) : href} className={`group block ${wrapperClassName}`} style={style}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div onClick={onClick} role="button" tabIndex={0} className={`group block cursor-pointer ${wrapperClassName}`} style={style} onKeyDown={(e) => e.key === 'Enter' && onClick()}>
        {content}
      </div>
    );
  }

  return <div className={`group block ${wrapperClassName}`} style={style}>{content}</div>;
}

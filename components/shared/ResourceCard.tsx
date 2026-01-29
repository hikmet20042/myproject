'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

interface ResourceCardProps {
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
}

/**
 * Standardized card component for displaying resources
 * Used across vacancies, events, NGOs, and materials pages
 */
export function ResourceCard({
  title,
  description,
  href,
  badges,
  footer,
  imageUrl,
  hoverBorderColor = 'hover:border-blue-300',
  hoverGradient = 'group-hover:from-blue-50 group-hover:to-indigo-50',
  icon,
  actionText,
  onClick,
  className = '',
}: ResourceCardProps) {
  const localePath = useLocalizedPath()
  const content = (
      <Card
        className={`h-full border-2 border-gray-200 ${hoverBorderColor} hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${className}`}
      >
        <CardContent className={`p-6 h-full flex flex-col bg-gradient-to-br from-white to-gray-50 ${hoverGradient} transition-all duration-300`}>
          {/* Image */}
          {imageUrl && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
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

          {/* Footer */}
          {footer && (
            <div className="mt-auto pt-4 border-t border-gray-200">
              {footer}
            </div>
          )}

          {/* Action Button */}
          {actionText && (
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
      <Link href={href.startsWith('/') ? localePath(href) : href} className="group block">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div onClick={onClick} role="button" tabIndex={0} className="group block cursor-pointer" onKeyDown={(e) => e.key === 'Enter' && onClick()}>
        {content}
      </div>
    );
  }

  return <div className="group block">{content}</div>;
}

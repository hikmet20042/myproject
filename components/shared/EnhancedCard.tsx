/**
 * EnhancedCard Component
 * Premium card with gradient overlay and hover effects
 * Used across: Dashboard, Profile, Resources, etc.
 */

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface EnhancedCardProps {
  title?: string
  icon?: LucideIcon
  iconGradient?: string
  children: ReactNode
  className?: string
  headerGradient?: string
  animationDelay?: number
}

export default function EnhancedCard({
  title,
  icon: Icon,
  iconGradient = 'from-blue-500 to-emerald-600',
  children,
  className = '',
  headerGradient,
  animationDelay = 0
}: EnhancedCardProps) {
  return (
    <Card
      shadow="md"
      className={`animate-fade-in ${className}`}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {(title || Icon) && (
        <div className={`relative px-6 py-6 ${headerGradient || 'bg-gradient-to-r from-slate-50 to-blue-50'} border-b-2 border-blue-100`}>
          {headerGradient && (
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/10"></div>
          )}
          
          <div className="relative flex items-center gap-3">
            {Icon && (
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center text-white shadow-lg`}>
                <Icon className="w-6 h-6" />
              </div>
            )}
            {title && (
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h2>
            )}
          </div>
        </div>
      )}
      
      <div className="p-6">
        {children}
      </div>
    </Card>
  )
}

/**
 * GradientHero Component
 * Reusable gradient hero section with animated background
 * Used across: Dashboard, Profile, Auth pages, Submit Blog, etc.
 */

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface GradientHeroProps {
  title: string
  subtitle?: string
  badge?: {
    icon: LucideIcon
    text: string
  }
  icon?: LucideIcon
  gradientFrom?: string
  gradientVia?: string
  gradientTo?: string
  children?: ReactNode
  showWave?: boolean
}

export default function GradientHero({
  title,
  subtitle,
  badge,
  icon: Icon,
  gradientFrom = 'from-blue-600',
  gradientVia = 'via-blue-700',
  gradientTo = 'to-emerald-700',
  children,
  showWave = true
}: GradientHeroProps) {
  const BadgeIcon = badge?.icon

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo}`}>
      {/* Animated Background Blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center space-y-6">
          {/* Icon and Badge - Arranged Together */}
          <div className="flex flex-col items-center gap-4">
            {Icon && (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md shadow-md border border-white/30">
                <Icon className="w-10 h-10 text-white" />
              </div>
            )}
            
           
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* Custom Children */}
          {children}
        </div>
      </div>

      
    </div>
  )
}

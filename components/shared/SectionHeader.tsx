/**
 * SectionHeader Component
 * Consistent section headers with icons
 * Used across: Multiple pages for section titles
 */

import { LucideIcon } from 'lucide-react'

interface SectionHeaderProps {
  icon?: LucideIcon
  title: string
  subtitle?: string
  iconGradient?: string
  badge?: string
}

export default function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  iconGradient = 'from-blue-500 to-indigo-600',
  badge
}: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {Icon && (
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
          {badge && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

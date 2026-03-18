/**
 * ActionButton Component
 * Solid action buttons with consistent styling
 * Used across: Forms, CTAs, Primary actions
 */

import { LucideIcon } from 'lucide-react'
import { ButtonHTMLAttributes } from 'react'

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon
  children: React.ReactNode
  gradientFrom?: string
  gradientTo?: string
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export default function ActionButton({
  icon: Icon,
  children,
  gradientFrom = 'from-blue-500',
  gradientTo = 'to-emerald-600',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}: ActionButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const tone =
    gradientFrom.includes('emerald') || gradientTo.includes('emerald')
      ? 'emerald'
      : gradientFrom.includes('cyan') || gradientTo.includes('cyan')
        ? 'cyan'
        : gradientFrom.includes('teal') || gradientTo.includes('teal')
          ? 'teal'
          : gradientFrom.includes('amber') || gradientTo.includes('amber')
            ? 'amber'
            : 'blue'

  const toneClasses = {
    blue: 'border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200',
    emerald: 'border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-200',
    cyan: 'border border-cyan-600 bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-200',
    teal: 'border border-teal-600 bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-200',
    amber: 'border border-amber-600 bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-200'
  }

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : 'w-full sm:w-auto'}
        font-bold
        ${toneClasses[tone]}
        rounded-xl
        shadow-md hover:shadow-lg
        hover:scale-[1.02]
        transition-all duration-200
        focus:outline-none focus:ring-2
        disabled:bg-slate-300 disabled:border-slate-300
        disabled:cursor-not-allowed
        disabled:hover:scale-100 disabled:hover:shadow-md
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className={iconSizes[size]} />}
      {children}
    </button>
  )
}

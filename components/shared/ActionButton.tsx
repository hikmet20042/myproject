/**
 * ActionButton Component
 * Gradient action buttons with consistent styling
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
  gradientFrom = 'from-pink-500',
  gradientTo = 'to-purple-600',
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

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : 'w-full sm:w-auto'}
        font-bold
        bg-gradient-to-r ${gradientFrom} ${gradientTo}
        hover:${gradientFrom.replace('from-', 'from-').replace('-500', '-600')}
        hover:${gradientTo.replace('to-', 'to-').replace('-600', '-700')}
        text-white
        rounded-xl
        shadow-lg hover:shadow-xl
        hover:scale-105
        transition-all duration-300
        disabled:from-gray-400 disabled:to-gray-500
        disabled:cursor-not-allowed
        disabled:hover:scale-100
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className={iconSizes[size]} />}
      {children}
    </button>
  )
}

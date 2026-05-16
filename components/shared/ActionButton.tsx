/**
 * ActionButton Component
 * Solid action buttons with consistent styling
 * Used across: Forms, CTAs, Primary actions
 */

import { LucideIcon } from 'lucide-react'
import { ButtonHTMLAttributes } from 'react'
import { Button } from '@/components/ui/Button'

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

  const toneVariants = {
    blue: 'primary',
    emerald: 'gradient-green',
    cyan: 'secondary',
    teal: 'secondary',
    amber: 'danger',
  } as const

  const mappedSize = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  } as const

  return (
    <Button
      variant={toneVariants[tone]}
      size={mappedSize[size]}
      icon={Icon}
      fullWidth={fullWidth}
      className={fullWidth ? className : `w-full sm:w-auto ${className}`}
      {...props}
    >
      {children}
    </Button>
  )
}

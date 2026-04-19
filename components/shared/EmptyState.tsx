import { Inbox } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'


interface EmptyStateProps {
  title: string
  message: string
  actionText?: string
  onAction?: () => void
  icon?: LucideIcon
  
  
  fullPage?: boolean
  className?: string
}

export default function EmptyState({
  title,
  message,
  actionText,
  onAction,
  icon: Icon = Inbox,
  
  
  fullPage = false,
  className = ''
}: EmptyStateProps) {
  const containerClassName = fullPage
    ? 'min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-6'
    : 'w-full ui-radius-xl border border-slate-200 bg-white ui-shadow-sm p-8 md:p-10 flex items-center justify-center'

  return (
    <div className={`${containerClassName} ${className}`}>
      <div className="mx-auto w-full max-w-lg text-center">
        
        <div className="brand-icon-chip mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm">
          <Icon className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-3 text-base leading-relaxed text-slate-500">
          {message || 'Hazırda burada məzmun görünmür. Bir addım atın və birlikdə dolduraq.'}
        </p>
        {actionText && onAction && (
          <Button onClick={onAction} variant="primary" size="lg" className="mt-8 min-w-[220px]">
            {actionText}
          </Button>
        )}
      </div>
    </div>
  )
}

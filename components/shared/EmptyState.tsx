import { Inbox, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type EmptyVariant = 'card' | 'inline' | 'section' | 'minimal' | 'compact' | 'sidebar' | 'chart' | 'blocknote'

interface EmptyStateProps {
  title?: string
  message: string
  variant?: EmptyVariant
  icon?: LucideIcon
  actionText?: string
  onAction?: () => void
  helpText?: string
  className?: string
}

export default function EmptyState({
  title,
  message,
  variant = 'card',
  icon: Icon = Inbox,
  actionText,
  onAction,
  helpText,
  className = '',
}: EmptyStateProps) {

  if (variant === 'minimal') {
    return <p className={`text-center py-8 text-slate-500 ${className}`}>{message}</p>
  }

  if (variant === 'compact') {
    return (
      <div className={`px-4 py-8 text-center text-gray-500 select-none ${className}`}>
        <div className="brand-icon-chip mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm">
          <Icon className="h-6 w-6" />
        </div>
        {title && <p className="text-sm font-semibold text-slate-700">{title}</p>}
        <p className="text-xs text-slate-400 mt-1">{message}</p>
      </div>
    )
  }

  if (variant === 'sidebar') {
    return <div className={`p-4 rounded-lg bg-slate-50 text-slate-500 text-sm ${className}`}>{message}</div>
  }

  if (variant === 'chart') {
    return <div className={`flex items-center justify-center h-80 text-slate-500 ${className}`}>{message}</div>
  }

  if (variant === 'blocknote') {
    return <div className={`text-slate-400 italic ${className}`}>{message}</div>
  }

  if (variant === 'section') {
    return (
      <Card className={`overflow-hidden border border-slate-200 shadow-sm ${className}`}>
        <CardContent padding="md">
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
            <Icon className="mx-auto mb-4 h-12 w-12 text-blue-300" />
            {title && <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>}
            <p className="mb-4 text-gray-600">{message}</p>
            {helpText && <p className="mx-auto max-w-md text-sm text-slate-500">{helpText}</p>}
            {actionText && onAction && (
              <Button onClick={onAction} variant="primary" size="md" className="mt-4">
                {actionText}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`px-6 py-12 text-center ${className}`}>
        <Icon className="mx-auto mb-4 h-12 w-12 text-slate-400" />
        {title && <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>}
        <p className="text-slate-500">{message}</p>
        {actionText && onAction && (
          <Button onClick={onAction} variant="primary" size="md" className="mt-4">
            {actionText}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={`w-full p-8 md:p-10 flex items-center justify-center ${className}`}>
      <div className="mx-auto w-full max-w-lg text-center">
        <div className="brand-icon-chip mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm">
          <Icon className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-3 text-base leading-relaxed text-slate-500">{message}</p>
        {actionText && onAction && (
          <Button onClick={onAction} variant="primary" size="lg" className="mt-8 min-w-[220px]">
            {actionText}
          </Button>
        )}
      </div>
    </Card>
  )
}

export type { EmptyVariant }

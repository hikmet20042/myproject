import { ShieldAlert } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type UnauthorizedVariant = 'card' | 'inline' | 'minimal'

interface UnauthorizedStateProps {
  title?: string
  message: string
  variant?: UnauthorizedVariant
  actionText?: string
  onAction?: () => void
  className?: string
}

export default function UnauthorizedState({
  title = 'Giriş Qadağandır',
  message,
  variant = 'card',
  actionText,
  onAction,
  className = '',
}: UnauthorizedStateProps) {
  if (variant === 'minimal') {
    return (
      <p className={`text-center py-4 text-amber-600 text-sm font-medium ${className}`}>
        {message}
      </p>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`px-6 py-12 text-center ${className}`}>
        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-amber-500" />
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
    <Card className={`max-w-lg mx-auto p-8 text-center ${className}`}>
      <div className="brand-icon-chip mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm bg-amber-50 text-amber-600">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
      <p className="text-slate-500 mb-6">{message}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary" size="lg" className="min-w-[200px]">
          {actionText}
        </Button>
      )}
    </Card>
  )
}

export type { UnauthorizedVariant }

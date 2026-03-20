import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface UnauthorizedStateProps {
  title?: string
  message: string
  actionText?: string
  onAction?: () => void
}

export default function UnauthorizedState({
  title = 'Giriş məhduddur',
  message,
  actionText,
  onAction,
}: UnauthorizedStateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mt-3 text-base text-gray-600">{message}</p>

        {onAction && actionText && (
          <Button
            onClick={onAction}
            variant="secondary"
            size="md"
            className="mt-7"
          >
            {actionText}
          </Button>
        )}
      </div>
    </div>
  )
}

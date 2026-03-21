import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface UnauthorizedStateProps {
  title?: string
  message: string
  actionText?: string
  onAction?: () => void
}

export default function UnauthorizedState({
  title = 'Giriş Qadağandır',
  message,
  actionText,
  onAction
}: UnauthorizedStateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md border-2 border-amber-200 p-8 text-center animate-scale-in">
        <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-red-500 rounded-full blur opacity-40"></div>
          <div className="relative w-full h-full bg-gradient-to-br from-amber-500 to-red-500 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-600 mb-8">{message}</p>

        {actionText && onAction && (
          <Button onClick={onAction} variant="primary" size="lg">
            {actionText}
          </Button>
        )}
      </div>
    </div>
  )
}
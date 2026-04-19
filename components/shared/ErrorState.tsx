/**
 * ErrorState Component
 * Consistent error states with gradient backgrounds
 * Used across: All pages with error handling
 */

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'


interface ErrorStateProps {
  title: string
  message: string
  onRetry?: () => void
  retryText?: string
  fullPage?: boolean
  className?: string
  gradientFrom?: string
  gradientVia?: string
  gradientTo?: string
}

export default function ErrorState({
  title,
  message,
  onRetry,
  retryText = 'Yenidən cəhd et',
  fullPage = true,
  className = '',
  gradientFrom = 'from-red-50',
  gradientVia = 'via-rose-50',
  gradientTo = 'to-amber-50'
}: ErrorStateProps) {
  const containerClassName = fullPage
    ? `min-h-screen bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} flex items-center justify-center p-4`
    : `w-full bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} rounded-2xl p-4 flex items-center justify-center`

  return (
    <div className={`${containerClassName} ${className}`}>
      <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertCircle className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mt-3 text-base text-gray-600">{message}</p>
        
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="danger"
            size="md"
            className="mt-7"
          >
            {retryText}
          </Button>
        )}
      </div>
    </div>
  )
}

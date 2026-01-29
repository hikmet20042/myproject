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
  gradientFrom?: string
  gradientVia?: string
  gradientTo?: string
}

export default function ErrorState({
  title,
  message,
  onRetry,
  retryText = 'Try Again',
  gradientFrom = 'from-red-50',
  gradientVia = 'via-orange-50',
  gradientTo = 'to-yellow-50'
}: ErrorStateProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} flex items-center justify-center p-4`}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border-2 border-red-200 p-8 text-center animate-scale-in">
        <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-orange-600 rounded-full blur opacity-50"></div>
          <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <h2 className="text-2xl font-black text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-600 mb-8">{message}</p>
        
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="primary"
            size="lg"
            className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
          >
            {retryText}
          </Button>
        )}
      </div>
    </div>
  )
}

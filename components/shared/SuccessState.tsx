/**
 * SuccessState Component
 * Consistent success states with animations
 * Used in: Submit Blog, Forms, Actions
 */

import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReactNode } from 'react'

interface SuccessStateProps {
  title: string
  message: string
  actions?: ReactNode
  gradientFrom?: string
  gradientVia?: string
  gradientTo?: string
}

export default function SuccessState({
  title,
  message,
  actions,
  gradientFrom = 'from-green-50',
  gradientVia = 'via-emerald-50',
  gradientTo = 'to-teal-50'
}: SuccessStateProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} flex items-center justify-center p-4`}>
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative text-center max-w-md animate-scale-in">
        {/* Success Icon */}
        <div className="relative inline-flex items-center justify-center mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur opacity-50 animate-pulse"></div>
          <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
            <CheckCircle className="w-12 h-12 text-white animate-bounce" />
          </div>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">{title}</h3>
        <p className="text-base sm:text-lg text-gray-700 mb-8 leading-relaxed">{message}</p>

        {/* Action Buttons */}
        {actions && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * SuccessState Component
 * Consistent success states with animations
 * Used in: Submit Blog, Forms, Actions
 */

import { CheckCircle } from 'lucide-react'
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
      <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle className="h-8 w-8" />
        </div>

        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        <p className="mt-3 text-base text-gray-600">{message}</p>

        {actions && (
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

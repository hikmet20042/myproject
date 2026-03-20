/**
 * LoadingState Component
 * Consistent loading states with gradient backgrounds
 * Used across: All pages with loading states
 */

import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  text?: string
}

export default function LoadingState({
  text = 'Yüklənir...'
}: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{'Yüklənir'}</h2>
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      </div>
    </div>
  )
}

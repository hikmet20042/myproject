/**
 * LoadingState Component
 * Consistent loading states with gradient backgrounds
 * Used across: All pages with loading states
 */

interface LoadingStateProps {
  text?: string
}

export default function LoadingState({
  text = 'Yüklənir...'
}: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
        <div className="text-lg font-semibold text-gray-700">{text}</div>
      </div>
    </div>
  )
}

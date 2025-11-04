/**
 * LoadingState Component
 * Consistent loading states with gradient backgrounds
 * Used across: All pages with loading states
 */

interface LoadingStateProps {
  text?: string
  gradientFrom?: string
  gradientVia?: string
  gradientTo?: string
  spinnerColor?: string
}

export default function LoadingState({
  text = 'Loading...',
  gradientFrom = 'from-blue-50',
  gradientVia = 'via-indigo-50',
  gradientTo = 'to-purple-50',
  spinnerColor = 'border-blue-500'
}: LoadingStateProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} flex items-center justify-center`}>
      <div className="text-center space-y-4">
        <div className={`animate-spin rounded-full h-16 w-16 border-4 ${spinnerColor} border-t-transparent mx-auto`}></div>
        <div className="text-lg font-semibold text-gray-700">{text}</div>
      </div>
    </div>
  )
}

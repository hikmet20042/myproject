/**
 * LoadingState Component
 * Consistent loading states with gradient backgrounds
 * Used across: All pages with loading states
 */

import { Loading } from '@/components/ui/Loading'
import { Card } from '@/components/ui/Card'

interface LoadingStateProps {
  title?: string
  text?: string
  
  fullPage?: boolean
  className?: string
}

export default function LoadingState({
  title = 'Yüklənir',
  fullPage = true,
  className = '',
  
  text = 'Yüklənir...'
}: LoadingStateProps) {
  const containerClassName = fullPage
    ? 'min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4'
    : 'w-full flex items-center justify-center p-4'

  return (
    <div className={`${containerClassName} ${className}`}>
      <Card className="w-full max-w-md p-8 text-center">
        
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Loading size="lg" variant="spinner" color="primary" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{text}</p>
      </Card>
    </div>
  )
}

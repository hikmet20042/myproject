import { Loading } from '@/components/ui/Loading'

type LoadingVariant = 'page' | 'spinner' | 'card' | 'list' | 'card-grid'

interface LoadingStateProps {
  title?: string
  text?: string
  variant?: LoadingVariant
  rows?: number
  className?: string
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
      <div className="h-4 w-3/5 rounded bg-slate-300" />
      <div className="mt-3 h-3 w-full rounded bg-slate-200" />
      <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
      <div className="mt-4 h-8 w-24 rounded-lg bg-slate-200" />
    </div>
  )
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="h-4 w-2/5 rounded bg-slate-300" />
          <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-1/3 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  )
}

function CardGridSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="h-5 w-3/5 rounded bg-slate-300" />
          <div className="mt-3 h-3 w-full rounded bg-slate-200" />
          <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
          <div className="mt-4 h-8 w-24 rounded-lg bg-slate-200" />
        </div>
      ))}
    </div>
  )
}

export default function LoadingState({
  title = 'Yüklənir',
  text = 'Yüklənir...',
  variant = 'page',
  rows,
  className = '',
}: LoadingStateProps) {
  if (variant === 'card') {
    return <CardSkeleton />
  }

  if (variant === 'list') {
    return <ListSkeleton rows={rows} />
  }

  if (variant === 'card-grid') {
    return <CardGridSkeleton rows={rows} />
  }

  if (variant === 'spinner') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
        <Loading size="lg" variant="spinner" color="primary" />
        {title && <p className="text-sm font-medium text-slate-500">{title}</p>}
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4 ${className}`}>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Loading size="lg" variant="spinner" color="primary" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{text}</p>
      </div>
    </div>
  )
}

export { CardSkeleton, ListSkeleton, CardGridSkeleton }
export type { LoadingVariant }

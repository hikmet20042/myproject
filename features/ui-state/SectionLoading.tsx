import LoadingState from '@/components/shared/LoadingState'

type SectionLoadingVariant = 'list' | 'card-grid' | 'notifications'

interface SectionLoadingProps {
  variant: SectionLoadingVariant
  rows?: number
}

function NotificationsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-300" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-2/5 rounded bg-slate-300" />
              <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-1/3 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SectionLoading({ variant, rows = 3 }: SectionLoadingProps) {
  if (variant === 'notifications') {
    return <NotificationsSkeleton rows={rows} />
  }

  if (variant === 'card-grid') {
    return <LoadingState variant="card-grid" rows={rows} />
  }

  return <LoadingState variant="list" rows={rows} />
}

'use client'

import ErrorState from '@/components/shared/ErrorState'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Rəhbər panelində xəta baş verdi"
      message="Zəhmət olmasa səhifəni yeniləyin və ya bir az sonra yenidən cəhd edin."
      onRetry={reset}
    />
  )
}

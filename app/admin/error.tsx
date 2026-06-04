'use client'

import ErrorState from '@/components/shared/ErrorState'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="İdarəetmə panelində xəta baş verdi"
      message="Zəhmət olmasa səhifəni yeniləyin və ya bir az sonra yenidən cəhd edin."
      onRetry={reset}
    />
  )
}

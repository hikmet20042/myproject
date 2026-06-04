'use client'

import ErrorState from '@/components/shared/ErrorState'

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Profil səhifəsində xəta baş verdi"
      message="Zəhmət olmasa səhifəni yeniləyin və ya bir az sonra yenidən cəhd edin."
      onRetry={reset}
    />
  )
}

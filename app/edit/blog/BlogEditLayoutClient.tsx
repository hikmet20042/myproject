'use client'

import { type ReactNode } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { LoadingState } from '@/components/shared'

export default function BlogEditLayoutClient({ children }: { children: ReactNode }) {
  const { isReady } = useAuthGuard({})

  if (!isReady) {
    return <LoadingState text="Yüklənir..." />
  }

  return <>{children}</>
}

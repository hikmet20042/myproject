'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'

export function useRequireAuth(): () => boolean {
  const { data: session, status } = useSession()
  const router = useRouter()
  const localePath = useLocalizedPath()

  return useCallback(() => {
    if (status === 'authenticated' && session) return true

    const callback = encodeURIComponent(window.location.pathname)
    router.push(localePath(`/auth/signin?callbackUrl=${callback}`))
    return false
  }, [status, session, router, localePath])
}

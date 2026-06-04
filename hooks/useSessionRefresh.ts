'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import type { ClientSession, SessionStatus } from '@/lib/auth/client'

const FOCUS_REFRESH_THROTTLE_MS = 15 * 1000
const FORCE_REFRESH_EVENT = 'auth:force-refresh'

interface UseSessionRefreshInput {
  status: SessionStatus
  isSessionReady: boolean
  session: ClientSession
  getSnapshotIsStale: (userId: string | undefined) => boolean
  refreshSession: () => Promise<void>
}

export function useSessionRefresh({
  status,
  isSessionReady,
  session,
  getSnapshotIsStale,
  refreshSession,
}: UseSessionRefreshInput) {
  const pathname = usePathname()
  const lastForceRefreshAtRef = useRef(0)

  // Staleness check on protected routes
  useEffect(() => {
    if (status !== 'authenticated' || !isSessionReady || !session?.user?.id) return

    const checkStale = () => {
      if (getSnapshotIsStale(session.user.id)) {
        void refreshSession()
      }
    }

    const isProtectedRoute =
      pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')
    if (isProtectedRoute) {
      checkStale()
    }

    const interval = window.setInterval(checkStale, 60_000)
    return () => {
      window.clearInterval(interval)
    }
  }, [getSnapshotIsStale, isSessionReady, pathname, refreshSession, session?.user?.id, status])

  // Visibility / focus / force-refresh listeners
  useEffect(() => {
    const shouldSkipRefresh = () => {
      const now = Date.now()
      if (now - lastForceRefreshAtRef.current < FOCUS_REFRESH_THROTTLE_MS) return true
      lastForceRefreshAtRef.current = now
      return false
    }

    const maybeRefresh = () => {
      if (status !== 'authenticated' || !isSessionReady || !session?.user?.id) return
      if (shouldSkipRefresh()) return
      void refreshSession()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') maybeRefresh()
    }

    const onWindowFocus = () => {
      maybeRefresh()
    }

    const onForceRefresh = () => {
      if (status !== 'authenticated' || !isSessionReady || !session?.user?.id) return
      void refreshSession()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onWindowFocus)
    window.addEventListener(FORCE_REFRESH_EVENT, onForceRefresh as EventListener)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onWindowFocus)
      window.removeEventListener(FORCE_REFRESH_EVENT, onForceRefresh as EventListener)
    }
  }, [isSessionReady, refreshSession, session?.user?.id, status])
}

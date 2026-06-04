'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { ClientSession, SessionStatus } from '@/lib/auth/client'

const PENDING_REFRESH_INTERVAL_MS = 10 * 1000

interface UsePendingOrgPollInput {
  status: SessionStatus
  isSessionReady: boolean
  session: ClientSession
  refreshSession: () => Promise<void>
}

export function usePendingOrgPoll({
  status,
  isSessionReady,
  session,
  refreshSession,
}: UsePendingOrgPollInput) {
  const pathname = usePathname()
  const router = useRouter()

  // Poll pending org status every 10s
  useEffect(() => {
    if (
      status !== 'authenticated' ||
      !isSessionReady ||
      !session?.user?.id ||
      session.user.accountType !== 'organization' ||
      session.user.organizationStatus !== 'pending' ||
      !pathname?.includes('/organization/pending')
    )
      return

    const refreshPendingState = () => {
      void refreshSession()
    }

    const interval = window.setInterval(refreshPendingState, PENDING_REFRESH_INTERVAL_MS)
    return () => {
      window.clearInterval(interval)
    }
  }, [isSessionReady, pathname, refreshSession, session?.user, status])

  // Redirect approved orgs away from /organization/pending
  useEffect(() => {
    if (
      status === 'authenticated' &&
      isSessionReady &&
      session?.user?.accountType === 'organization' &&
      session.user.organizationStatus === 'approved' &&
      pathname?.includes('/organization/pending')
    ) {
      router.replace('/dashboard')
    }
  }, [
    isSessionReady,
    pathname,
    router,
    session?.user?.accountType,
    session?.user?.organizationStatus,
    status,
  ])
}

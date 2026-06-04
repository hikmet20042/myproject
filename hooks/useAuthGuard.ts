'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, type ClientSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'

type AuthGuardOptions = {
  allowedAccountTypes?: Array<'user' | 'organization' | 'admin'>
  blockPendingOrganizations?: boolean
  /** Custom redirect for blocked account types. Defaults to `/dashboard` for orgs, `/` for users. */
  blockedRedirectTo?: string
}

export function useAuthGuard(opts: AuthGuardOptions = {}): {
  isReady: boolean
  session: ClientSession
} {
  const { data: session, status } = useSession()
  const router = useRouter()
  const localePath = useLocalizedPath()
  const [isReady, setIsReady] = useState(false)

  const { allowedAccountTypes, blockPendingOrganizations, blockedRedirectTo } = opts
  const accountType = session?.user?.accountType ?? null
  const organizationStatus = session?.user?.organizationStatus ?? null

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      const callback = encodeURIComponent(window.location.pathname)
      router.replace(localePath(`/auth/signin?callbackUrl=${callback}`))
      return
    }

    if (!accountType) {
      router.replace(localePath('/onboarding/role'))
      return
    }

    if (allowedAccountTypes && !allowedAccountTypes.includes(accountType)) {
      if (accountType === 'organization' && organizationStatus === 'pending') {
        router.replace(localePath('/organization/pending'))
        return
      }
      if (blockedRedirectTo) {
        router.replace(localePath(blockedRedirectTo))
        return
      }
      if (accountType === 'organization') {
        router.replace(localePath('/dashboard'))
        return
      }
      router.replace(localePath('/'))
      return
    }

    if (
      blockPendingOrganizations &&
      accountType === 'organization' &&
      organizationStatus === 'pending'
    ) {
      router.replace(localePath('/organization/pending'))
      return
    }

    setIsReady(true)
  }, [status, accountType, organizationStatus, allowedAccountTypes, blockPendingOrganizations, blockedRedirectTo, router, localePath])

  return { isReady, session }
}

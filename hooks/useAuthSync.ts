'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { type ClientSession, type ClientSessionUser, type SessionStatus } from '@/lib/auth/client'
import { emitGlobalFeedback } from '@/hooks/useGlobalFeedback'
import type { AccountSnapshot } from '@/hooks/useAccountCache'

const DEBUG_AUTH_CLIENT = process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true'

function areUsersEqual(a: ClientSessionUser, b: ClientSessionUser) {
  return (
    a.id === b.id &&
    a.email === b.email &&
    a.name === b.name &&
    a.role === b.role &&
    a.emailVerified === b.emailVerified &&
    a.organizationStatus === b.organizationStatus &&
    a.accountType === b.accountType &&
    a.isActive === b.isActive
  )
}

function areSessionsEqual(a: ClientSession, b: ClientSession) {
  if (a === b) return true
  if (!a || !b) return false
  return areUsersEqual(a.user, b.user)
}

interface UseAuthSyncInput {
  supabase: SupabaseClient | null
  getAccountSnapshot: (userId: string, forceRefresh?: boolean) => Promise<AccountSnapshot | null>
  clearCache: () => void
}

export function useAuthSync({ supabase, getAccountSnapshot, clearCache }: UseAuthSyncInput) {
  const [session, setSession] = useState<ClientSession>(null)
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [isSessionReady, setIsSessionReady] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const previousStatusRef = useRef<SessionStatus>('loading')
  const isMountedRef = useRef(false)
  const isSyncingRef = useRef(false)
  const isInitialMountRef = useRef(true)

  const applyAuthState = useCallback((nextSession: ClientSession, nextStatus: SessionStatus) => {
    setSession((prev) => (areSessionsEqual(prev, nextSession) ? prev : nextSession))
    setStatus((prev) => (prev === nextStatus ? prev : nextStatus))
    const ready = nextStatus === 'authenticated' && !!nextSession?.user
    setIsSessionReady((prev) => (prev === ready ? prev : ready))
  }, [])

  const syncAuth = useCallback(
    async (
      _reason: string,
      authUser?: User | null,
      options?: { forceAccountRefresh?: boolean },
    ) => {
      if (!supabase) {
        applyAuthState(null, 'unauthenticated')
        return
      }

      if (isSyncingRef.current) return

      isSyncingRef.current = true
      setSyncError(null)
      if (isInitialMountRef.current) {
        setIsSessionReady(false)
      }

      try {
        const user =
          authUser === undefined ? (await supabase.auth.getUser()).data.user : authUser

        if (!isMountedRef.current) return

        if (!user) {
          applyAuthState(null, 'unauthenticated')
          clearCache()
          return
        }

        if (!isMountedRef.current) return

        const snapshot = await getAccountSnapshot(user.id, options?.forceAccountRefresh)

        if (!snapshot || !snapshot.isActive) {
          if (DEBUG_AUTH_CLIENT) {
            console.warn(
              '[auth]',
              !snapshot ? 'Missing account row' : 'Inactive account',
              { userId: user.id },
            )
          }
          await supabase.auth.signOut()
          clearCache()
          applyAuthState(null, 'unauthenticated')
          return
        }

        const nextSession: ClientSession = {
          user: {
            id: user.id,
            email: user.email ?? null,
            role: snapshot.role,
            accountType: snapshot.accountType,
            organizationStatus: snapshot.organizationStatus,
            emailVerified: !!user.email_confirmed_at,
            name:
              user.user_metadata?.name ||
              user.user_metadata?.full_name ||
              user.user_metadata?.display_name ||
              user.email?.split('@')[0] ||
              'User',
            isActive: snapshot.isActive,
          },
        }

        applyAuthState(nextSession, 'authenticated')
      } catch (error) {
        if (DEBUG_AUTH_CLIENT) {
          console.error('[auth] Sync error:', error)
        }
        setSyncError('Auth session erroru. Səhifəni yeniləyin.')
        if (isInitialMountRef.current) {
          setIsSessionReady(false)
        }
      } finally {
        isSyncingRef.current = false
        isInitialMountRef.current = false
      }
    },
    [applyAuthState, getAccountSnapshot, supabase, clearCache],
  )

  const refreshSession = useCallback(async () => {
    await syncAuth('manual:refresh', undefined, { forceAccountRefresh: true })
  }, [syncAuth])

  // Mount effect + auth subscription
  useEffect(() => {
    isMountedRef.current = true
    if (DEBUG_AUTH_CLIENT) {
      console.debug('[auth] provider:mount')
    }

    if (!supabase) {
      applyAuthState(null, 'unauthenticated')
      return () => {
        isMountedRef.current = false
      }
    }

    void syncAuth('mount')

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, authSession) => {
      if (DEBUG_AUTH_CLIENT) {
        console.debug('[auth] onAuthStateChange', { event })
      }

      if (event === 'SIGNED_IN') {
        clearCache()
        void syncAuth(`auth:${event}`, authSession?.user ?? null, {
          forceAccountRefresh: true,
        })
        return
      }

      if (event === 'SIGNED_OUT') {
        clearCache()
      }

      if (event === 'TOKEN_REFRESHED') return

      void syncAuth(`auth:${event}`, authSession?.user ?? null)
    })

    return () => {
      isMountedRef.current = false
      subscription.unsubscribe()
    }
    // isMountedRef is a ref (stable), subscription is local — not needed in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyAuthState, clearCache, supabase, syncAuth])

  // Status transition debug logging
  useEffect(() => {
    if (previousStatusRef.current !== status) {
      if (DEBUG_AUTH_CLIENT) {
        console.debug('[auth] status:transition', {
          from: previousStatusRef.current,
          to: status,
        })
      }
      previousStatusRef.current = status
    }
  }, [status])

  // Sync error toast
  useEffect(() => {
    if (!syncError) return
    emitGlobalFeedback('error', syncError)
    const toastTimeout = setTimeout(() => setSyncError(null), 5000)
    return () => clearTimeout(toastTimeout)
  }, [syncError])

  return { session, status, isSessionReady, syncError, refreshSession }
}

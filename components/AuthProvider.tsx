'use client'

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  AuthSessionContext,
  type ClientSession,
  type ClientSessionUser,
  type SessionStatus,
} from '@/lib/auth/client'

interface AuthProviderProps {
  children: ReactNode
}

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

export default function AuthProvider({ children }: AuthProviderProps) {
  const supabase = useMemo(() => {
    // During SSR/prerender (e.g. Netlify build), skip client creation to avoid crashing
    // when NEXT_PUBLIC_SUPABASE_* vars are missing in the build environment.
    if (typeof window === 'undefined') {
      return null
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return null
    }

    return createSupabaseBrowserClient()
  }, [])
  const [session, setSession] = useState<ClientSession>(null)
  const [status, setStatus] = useState<SessionStatus>('loading')
  const previousStatusRef = useRef<SessionStatus>('loading')
  const isMountedRef = useRef(false)
  const isSyncingRef = useRef(false)

  const applyAuthState = useCallback((nextSession: ClientSession, nextStatus: SessionStatus) => {
    setSession((prev) => (areSessionsEqual(prev, nextSession) ? prev : nextSession))
    setStatus((prev) => (prev === nextStatus ? prev : nextStatus))
  }, [])

  const syncAuth = useCallback(async (reason: string) => {
    if (!supabase) {
      applyAuthState(null, 'unauthenticated')
      return
    }

    if (isSyncingRef.current) {
      console.debug('[auth] sync:skip concurrent', { reason })
      return
    }

    isSyncingRef.current = true
    console.debug('[auth] sync:start', { reason })

    try {
      const { data } = await supabase.auth.getUser()
      if (!isMountedRef.current) return

      if (!data?.user) {
        applyAuthState(null, 'unauthenticated')
        console.debug('[auth] sync:end unauthenticated', { reason })
        return
      }

      const { data: account } = await supabase
        .from('accounts')
        .select('account_type, is_admin, is_active')
        .eq('id', data.user.id)
        .maybeSingle()

      const accountType = account?.account_type as 'user' | 'organization' | undefined
      const role: 'admin' | 'user' = account?.is_admin ? 'admin' : 'user'

      let profileName: string | null | undefined = data.user.user_metadata?.name
      let organizationStatus: 'pending' | 'approved' | 'rejected' | null = null

      if (accountType === 'organization') {
        const { data: organizationProfile } = await supabase
          .from('organization_profiles')
          .select('organization_name, moderation_status')
          .eq('account_id', data.user.id)
          .maybeSingle()

        if (!organizationProfile) {
          console.warn(`Missing organization_profiles row for account_id=${data.user.id}`)
        }

        profileName = organizationProfile?.organization_name ?? profileName
        const moderationStatus = organizationProfile?.moderation_status
        organizationStatus =
          moderationStatus === 'pending' || moderationStatus === 'approved' || moderationStatus === 'rejected'
            ? moderationStatus
            : null
      } else {
        const { data: profile } = await supabase
          .from('users')
          .select('name')
          .eq('id', data.user.id)
          .maybeSingle()

        profileName = profile?.name ?? profileName
      }

      const nextSession: ClientSession = {
        user: {
          id: data.user.id,
          email: data.user.email ?? null,
          name: profileName ?? null,
          role,
          emailVerified: !!data.user.email_confirmed_at,
          accountType: accountType === 'organization' ? 'organization' : 'user',
          organizationStatus,
          isActive: account?.is_active ?? true,
        },
      }

      if (process.env.NODE_ENV === 'development') {
        console.debug('[auth][client] authority', {
          id: nextSession.user.id,
          role: nextSession.user.role,
          accountType: nextSession.user.accountType,
          organizationStatus: nextSession.user.organizationStatus,
        })
      }

      applyAuthState(nextSession, 'authenticated')
      console.debug('[auth] sync:end authenticated', {
        reason,
        userId: nextSession.user.id,
        role: nextSession.user.role,
        accountType: nextSession.user.accountType,
      })
    } catch (error) {
      console.error('[auth] sync:error', { reason, error })
    } finally {
      isSyncingRef.current = false
    }
  }, [applyAuthState, supabase])

  useEffect(() => {
    isMountedRef.current = true
    console.debug('[auth] provider:mount')

    if (!supabase) {
      applyAuthState(null, 'unauthenticated')
      return () => {
        isMountedRef.current = false
      }
    }

    void syncAuth('mount')

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      console.debug('[auth] onAuthStateChange', { event })

      // Avoid extra profile/account roundtrips for token refresh churn.
      if (event === 'TOKEN_REFRESHED') {
        return
      }

      void syncAuth(`auth:${event}`)
    })

    return () => {
      isMountedRef.current = false
      console.debug('[auth] provider:unmount')
      subscription.unsubscribe()
    }
    // Mount once: keep one auth subscription for the whole app lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyAuthState, supabase, syncAuth])

  useEffect(() => {
    if (previousStatusRef.current !== status) {
      console.debug('[auth] status:transition', {
        from: previousStatusRef.current,
        to: status,
      })
      previousStatusRef.current = status
    }

    if (status !== 'loading') {
      console.debug('[auth] ready', {
        status,
        userId: session?.user?.id ?? null,
      })
    }
  }, [session?.user?.id, status])

  const contextValue = useMemo(
    () => ({ data: session, status }),
    [session, status],
  )

  return (
    <AuthSessionContext.Provider value={contextValue}>
      {children}
    </AuthSessionContext.Provider>
  )
}

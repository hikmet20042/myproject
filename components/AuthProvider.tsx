'use client'

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { getPostLoginRedirect, normalizeInternalCallbackUrl } from '@/lib/auth/redirect'
import {
  AuthSessionContext,
  type ClientSession,
  type ClientSessionUser,
  type SessionStatus,
} from '@/lib/auth/client'

interface AuthProviderProps {
  children: ReactNode
}

const ACCOUNT_REVALIDATE_MS = 60 * 1000
const AUTH_CALLBACK_STORAGE_KEY = 'auth:callbackUrl'
const FORCE_REFRESH_EVENT = 'auth:force-refresh'
const FOCUS_REFRESH_THROTTLE_MS = 15 * 1000
const PENDING_REFRESH_INTERVAL_MS = 10 * 1000
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

export default function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
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
  const [isSessionReady, setIsSessionReady] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const previousStatusRef = useRef<SessionStatus>('loading')
  const isMountedRef = useRef(false)
  const isSyncingRef = useRef(false)
  const isInitialMountRef = useRef(true)
  const accountSnapshotRef = useRef<
    Map<
      string,
      {
        role: 'admin' | 'user'
        accountType: 'user' | 'organization' | null
        organizationStatus: 'pending' | 'approved' | 'rejected' | null
        isActive: boolean
        lastFetchedAt: number
      }
    >
  >(new Map())
  const redirectInProgressRef = useRef(false)
  const hasRedirectedRef = useRef(false)
  const invalidRedirectInProgressRef = useRef(false)
  const hadAuthenticatedSessionRef = useRef(false)
  const lastForceRefreshAtRef = useRef(0)

  const applyAuthState = useCallback((nextSession: ClientSession, nextStatus: SessionStatus) => {
    setSession((prev) => (areSessionsEqual(prev, nextSession) ? prev : nextSession))
    setStatus((prev) => (prev === nextStatus ? prev : nextStatus))

    const ready = nextStatus === 'authenticated' && !!nextSession?.user
    setIsSessionReady((prev) => (prev === ready ? prev : ready))
  }, [])

  const getProtectedPathCallback = useCallback(() => {
    if (typeof window === 'undefined' || !pathname) {
      return null
    }

    if (pathname.startsWith('/auth')) {
      return null
    }

    return `${window.location.pathname}${window.location.search}${window.location.hash}`
  }, [pathname])

  const getSnapshotIsStale = useCallback((userId: string | undefined) => {
    if (!userId) {
      return true
    }

    const snapshot = accountSnapshotRef.current.get(userId)
    if (!snapshot) {
      return true
    }

    return Date.now() - snapshot.lastFetchedAt >= ACCOUNT_REVALIDATE_MS
  }, [])

  const getAccountSnapshot = useCallback(async (userId: string, forceRefresh = false) => {
    const cached = accountSnapshotRef.current.get(userId)
    const isFresh = !!cached && Date.now() - cached.lastFetchedAt < ACCOUNT_REVALIDATE_MS
    if (cached && !forceRefresh && isFresh) {
      return cached
    }

    const client = supabase
    if (!client) return null

    // Fetch accounts and organization_profiles in parallel if needed
    const { data: account, error: accountError } = await client
      .from('accounts')
      .select('account_type, is_admin, is_active')
      .eq('id', userId)
      .maybeSingle()

    if (accountError || !account) {
      accountSnapshotRef.current.delete(userId)
      return null
    }

    const accountType = (account.account_type ?? null) as 'user' | 'organization' | null
    const role: 'admin' | 'user' = account.is_admin ? 'admin' : 'user'
    let organizationStatus: 'pending' | 'approved' | 'rejected' | null = null

    if (accountType === 'organization') {
      const { data: orgProfile } = await client
        .from('organization_profiles')
        .select('moderation_status')
        .eq('account_id', userId)
        .maybeSingle()

      organizationStatus = (orgProfile?.moderation_status as any) || null
    }

    const snapshot = {
      role,
      accountType,
      organizationStatus,
      isActive: account.is_active ?? true,
      lastFetchedAt: Date.now(),
    } as const

    accountSnapshotRef.current.set(userId, snapshot)
    return snapshot
  }, [supabase])

  const syncAuth = useCallback(async (
    _reason: string,
    authUser?: User | null,
    options?: { forceAccountRefresh?: boolean },
  ) => {
    if (!supabase) {
      applyAuthState(null, 'unauthenticated')
      return
    }

    if (isSyncingRef.current) {
      return
    }

    isSyncingRef.current = true
    setSyncError(null)
    if (isInitialMountRef.current) {
      setIsSessionReady(false)
    }

    try {
      const user = authUser === undefined
        ? (await supabase.auth.getUser()).data.user
        : authUser

      if (!isMountedRef.current) return

      if (!user) {
        applyAuthState(null, 'unauthenticated')
        accountSnapshotRef.current.clear()
        return
      }

      const snapshot = await getAccountSnapshot(user.id, options?.forceAccountRefresh)

      if (!snapshot || !snapshot.isActive) {
        if (DEBUG_AUTH_CLIENT && !snapshot) {
          console.warn('[auth] Missing account row', { userId: user.id })
        } else if (DEBUG_AUTH_CLIENT) {
          console.warn('[auth] Inactive account', { userId: user.id })
        }
        await supabase.auth.signOut()
        accountSnapshotRef.current.clear()
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
          // Keep these for compatibility if they are used elsewhere
          name: user.user_metadata?.name || user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
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
  }, [applyAuthState, getAccountSnapshot, supabase])

  const refreshSession = useCallback(async () => {
    await syncAuth('manual:refresh', undefined, { forceAccountRefresh: true })
  }, [syncAuth])

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
        hasRedirectedRef.current = false
        // Clear account cache on sign-in to ensure fresh account type
        accountSnapshotRef.current.clear()
        // Force account refresh on sign-in to get latest account_type
        void syncAuth(`auth:${event}`, authSession?.user ?? null, { forceAccountRefresh: true })
        return
      }

      if (event === 'SIGNED_OUT') {
        hasRedirectedRef.current = false
        // Clear account cache on sign-out
        accountSnapshotRef.current.clear()
      }

      // Avoid extra profile/account roundtrips for token refresh churn.
      if (event === 'TOKEN_REFRESHED') {
        return
      }

      void syncAuth(`auth:${event}`, authSession?.user ?? null)
    })

    return () => {
      isMountedRef.current = false
      if (DEBUG_AUTH_CLIENT) {
        console.debug('[auth] provider:unmount')
      }
      subscription.unsubscribe()
    }
    // Mount once: keep one auth subscription for the whole app lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyAuthState, supabase, syncAuth])

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

    if (status === 'authenticated') {
      hadAuthenticatedSessionRef.current = true
    }

    if (status !== 'loading') {
      if (DEBUG_AUTH_CLIENT) {
        console.debug('[auth] ready', {
          status,
          userId: session?.user?.id ?? null,
        })
      }
    }
  }, [session?.user?.id, status])

  useEffect(() => {
    if (!syncError || typeof window === 'undefined') {
      return
    }

    const toastTimeout = setTimeout(() => {
      setSyncError(null)
    }, 5000)

    return () => {
      clearTimeout(toastTimeout)
    }
  }, [syncError])

  useEffect(() => {
    if (!supabase || status !== 'authenticated' || !isSessionReady || !session?.user?.id) {
      return
    }

    const checkStale = () => {
      if (getSnapshotIsStale(session.user.id)) {
        void refreshSession()
      }
    }

    const isProtectedRoute = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')
    if (isProtectedRoute) {
      checkStale()
    }

    const interval = window.setInterval(checkStale, 60_000)

    return () => {
      window.clearInterval(interval)
    }
  }, [getSnapshotIsStale, isSessionReady, pathname, refreshSession, session?.user?.id, status, supabase])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const shouldSkipRefresh = () => {
      const now = Date.now()
      if (now - lastForceRefreshAtRef.current < FOCUS_REFRESH_THROTTLE_MS) {
        return true
      }
      lastForceRefreshAtRef.current = now
      return false
    }

    const maybeRefresh = () => {
      if (status !== 'authenticated' || !isSessionReady || !session?.user?.id) {
        return
      }
      if (shouldSkipRefresh()) {
        return
      }
      void refreshSession()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        maybeRefresh()
      }
    }

    const onWindowFocus = () => {
      maybeRefresh()
    }

    const onForceRefresh = () => {
      if (status !== 'authenticated' || !isSessionReady || !session?.user?.id) {
        return
      }
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

  useEffect(() => {
    if (
      status !== 'authenticated' ||
      !isSessionReady ||
      !session?.user?.id ||
      session.user.accountType !== 'organization' ||
      session.user.organizationStatus !== 'pending' ||
      !pathname?.includes('/organization/pending')
    ) {
      return
    }

    const refreshPendingState = () => {
      void refreshSession()
    }

    const interval = window.setInterval(refreshPendingState, PENDING_REFRESH_INTERVAL_MS)
    return () => {
      window.clearInterval(interval)
    }
  }, [isSessionReady, pathname, refreshSession, session?.user, status])

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
  }, [isSessionReady, pathname, router, session?.user?.accountType, session?.user?.organizationStatus, status])

  useEffect(() => {
    if (typeof window === 'undefined' || !pathname) {
      return
    }

    if (pathname === '/auth/signin') {
      const callbackFromQuery = searchParams?.get('callbackUrl')
      const safeCallback = normalizeInternalCallbackUrl(callbackFromQuery)

      if (safeCallback) {
        window.sessionStorage.setItem(AUTH_CALLBACK_STORAGE_KEY, safeCallback)
      } else {
        window.sessionStorage.removeItem(AUTH_CALLBACK_STORAGE_KEY)
      }

      if (status === 'authenticated' && isSessionReady) {
        redirectInProgressRef.current = false
        hasRedirectedRef.current = false
      }
    }
  }, [isSessionReady, pathname, searchParams, status])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (status !== 'authenticated' || !isSessionReady || !session?.user || pathname !== '/auth/signin') {
      redirectInProgressRef.current = false
      return
    }

    if (redirectInProgressRef.current || hasRedirectedRef.current) {
      return
    }

    const callbackFromQuery = normalizeInternalCallbackUrl(searchParams?.get('callbackUrl'))
    const callbackFromStorage = window.sessionStorage.getItem(AUTH_CALLBACK_STORAGE_KEY)
    const destination = getPostLoginRedirect(session, callbackFromQuery ?? callbackFromStorage)

    if (destination === pathname) {
      return
    }

    redirectInProgressRef.current = true
    hasRedirectedRef.current = true
    window.sessionStorage.removeItem(AUTH_CALLBACK_STORAGE_KEY)
    router.replace(destination)
  }, [isSessionReady, pathname, router, searchParams, session, status])

  useEffect(() => {
    if (typeof window === 'undefined' || !pathname) {
      return
    }

    if (status !== 'unauthenticated') {
      invalidRedirectInProgressRef.current = false
      return
    }

    if (!hadAuthenticatedSessionRef.current) {
      return
    }

    hasRedirectedRef.current = false
    window.sessionStorage.removeItem(AUTH_CALLBACK_STORAGE_KEY)

    if (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/callback')) {
      hadAuthenticatedSessionRef.current = false
      return
    }

    if (invalidRedirectInProgressRef.current) {
      return
    }

    const callback = getProtectedPathCallback()
    invalidRedirectInProgressRef.current = true
    hadAuthenticatedSessionRef.current = false
    if (callback) {
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(callback)}`)
      return
    }

    router.replace('/auth/signin')
  }, [getProtectedPathCallback, pathname, router, status])

  const contextValue = useMemo(
    () => ({ data: session, status, isSessionReady, refreshSession }),
    [isSessionReady, refreshSession, session, status],
  )

  return (
    <AuthSessionContext.Provider value={contextValue}>
      {children}
    </AuthSessionContext.Provider>
  )
}

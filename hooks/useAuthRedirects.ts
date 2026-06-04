'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getPostLoginRedirect, normalizeInternalCallbackUrl } from '@/lib/auth/redirect'
import type { ClientSession, SessionStatus } from '@/lib/auth/client'

const AUTH_CALLBACK_STORAGE_KEY = 'auth:callbackUrl'

interface UseAuthRedirectsInput {
  status: SessionStatus
  isSessionReady: boolean
  session: ClientSession
}

export function useAuthRedirects({ status, isSessionReady, session }: UseAuthRedirectsInput) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const redirectInProgressRef = useRef(false)
  const hasRedirectedRef = useRef(false)
  const invalidRedirectInProgressRef = useRef(false)
  const hadAuthenticatedSessionRef = useRef(false)

  // Track if the user was ever authenticated this session
  useEffect(() => {
    if (status === 'authenticated') {
      hadAuthenticatedSessionRef.current = true
    }
  }, [status])

  // Callback URL storage on /auth/signin
  useEffect(() => {
    if (typeof window === 'undefined' || !pathname) return

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

  // Post-login redirect from /auth/signin
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (
      status !== 'authenticated' ||
      !isSessionReady ||
      !session?.user ||
      pathname !== '/auth/signin'
    ) {
      redirectInProgressRef.current = false
      return
    }

    if (redirectInProgressRef.current || hasRedirectedRef.current) return

    const callbackFromQuery = normalizeInternalCallbackUrl(searchParams?.get('callbackUrl'))
    const callbackFromStorage = window.sessionStorage.getItem(AUTH_CALLBACK_STORAGE_KEY)
    const destination = getPostLoginRedirect(session, callbackFromQuery ?? callbackFromStorage)

    if (destination === pathname) return

    redirectInProgressRef.current = true
    hasRedirectedRef.current = true
    window.sessionStorage.removeItem(AUTH_CALLBACK_STORAGE_KEY)
    router.replace(destination)
  }, [isSessionReady, pathname, router, searchParams, session, status])

  // Session invalidation redirect (authenticated → unauthenticated)
  useEffect(() => {
    if (typeof window === 'undefined' || !pathname) return

    if (status !== 'unauthenticated') {
      invalidRedirectInProgressRef.current = false
      return
    }

    if (!hadAuthenticatedSessionRef.current) return

    hasRedirectedRef.current = false
    window.sessionStorage.removeItem(AUTH_CALLBACK_STORAGE_KEY)

    if (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/callback')) {
      hadAuthenticatedSessionRef.current = false
      return
    }

    if (invalidRedirectInProgressRef.current) return

    const callback =
      !pathname.startsWith('/auth')
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : null

    invalidRedirectInProgressRef.current = true
    hadAuthenticatedSessionRef.current = false

    if (callback) {
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(callback)}`)
      return
    }

    router.replace('/auth/signin')
  }, [pathname, router, status])
}

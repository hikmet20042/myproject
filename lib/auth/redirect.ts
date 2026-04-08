import type { ClientSession } from '@/lib/auth/client'
import { canAccessAdmin, canAccessDashboard, isOrganization } from '@/lib/auth/permissions'

export function normalizeInternalCallbackUrl(callbackUrl?: string | null) {
  if (!callbackUrl) {
    return null
  }

  try {
    const baseOrigin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin
    const normalized = new URL(callbackUrl, baseOrigin)
    if (normalized.origin !== baseOrigin) {
      return null
    }

    return `${normalized.pathname}${normalized.search}${normalized.hash}`
  } catch {
    return callbackUrl.startsWith('/') ? callbackUrl : null
  }
}

function isAllowedProtectedPath(session: ClientSession, path: string) {
  if (!session?.user) {
    return false
  }
  const normalizedSession = {
    user: {
      ...session.user,
      accountType: session.user.accountType ?? undefined,
    },
  }

  if (path.startsWith('/admin')) {
    return canAccessAdmin(normalizedSession)
  }

  if (path.startsWith('/dashboard')) {
    return canAccessDashboard(normalizedSession)
  }

  if (path.startsWith('/profile')) {
    return true
  }

  return true
}

function getDefaultAuthenticatedRedirect(session: ClientSession) {
  if (!session?.user?.accountType) {
    return '/onboarding/role'
  }

  const normalizedSession = {
    user: {
      ...session.user,
      accountType: session.user.accountType ?? undefined,
    },
  }

  if (isOrganization(normalizedSession)) {
    return '/dashboard'
  }

  return '/'
}

export function getPostLoginRedirect(session: ClientSession, callbackUrl?: string | null) {
  if (!session?.user) {
    return '/auth/signin'
  }

  const safeCallbackUrl = normalizeInternalCallbackUrl(callbackUrl)
  if (safeCallbackUrl && !safeCallbackUrl.startsWith('/auth/signin') && !safeCallbackUrl.startsWith('/auth/callback')) {
    if (!isAllowedProtectedPath(session, safeCallbackUrl)) {
      return getDefaultAuthenticatedRedirect(session)
    }

    return safeCallbackUrl
  }

  return getDefaultAuthenticatedRedirect(session)
}

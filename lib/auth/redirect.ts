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
    if (session.user.organizationStatus === 'rejected') {
      return false
    }
    return canAccessDashboard(normalizedSession)
  }

  if (path.startsWith('/profile')) {
    return true
  }

  if (path.startsWith('/organization')) {
    if (session.user.organizationStatus === 'rejected' && !path.startsWith('/organization/pending')) {
      return false
    }
    return true
  }

  return true
}

function getDefaultAuthenticatedRedirect(session: ClientSession) {
  if (!session?.user?.accountType) {
    return '/onboarding/role'
  }

  if (session.user.accountType === 'organization' && session.user.organizationStatus === 'pending') {
    return '/organization/pending'
  }

  if (session.user.accountType === 'organization' && session.user.organizationStatus === 'rejected') {
    return '/organization/pending'
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

  if (!session.user.accountType) {
    return '/onboarding/role'
  }

  const normalized = normalizeInternalCallbackUrl(callbackUrl)
  if (normalized && normalized !== '/auth/signin' && normalized !== '/auth/register') {
    if (isAllowedProtectedPath(session, normalized)) {
      return normalized
    }
  }

  return getDefaultAuthenticatedRedirect(session)
}

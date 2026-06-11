/**
 * Shared auth provider utilities.
 * Extracted from app/api/auth/change-email/route.ts and app/api/users/account/route.ts
 * to eliminate duplication.
 */

export type ProviderInfo = {
  providers: string[]
  hasPasswordProvider: boolean
  isGoogleOnly: boolean
}

export const RECENT_REAUTH_WINDOW_MS = 5 * 60 * 1000

/**
 * Extract auth provider information from a Supabase user object.
 */
export function getAuthProviderInfo(user: any): ProviderInfo {
  const identities = Array.isArray(user?.identities) ? user.identities : []
  const providers = new Set<string>()

  for (const identity of identities) {
    const provider = String(identity?.provider || '').trim().toLowerCase()
    if (provider) providers.add(provider)
  }

  const appProvider = String(user?.app_metadata?.provider || '').trim().toLowerCase()
  if (appProvider) providers.add(appProvider)

  const providerList = Array.from(providers)
  const hasPasswordProvider = providerList.includes('email')
  const isGoogleOnly = providerList.includes('google') && !hasPasswordProvider

  return {
    providers: providerList,
    hasPasswordProvider,
    isGoogleOnly,
  }
}

/**
 * Check if the user has signed in recently (within the re-auth window).
 */
export function hasRecentSignIn(user: any): boolean {
  const lastSignInAtRaw = user?.last_sign_in_at
  if (!lastSignInAtRaw) return false
  const lastSignInAt = new Date(lastSignInAtRaw).getTime()
  if (Number.isNaN(lastSignInAt)) return false
  return Date.now() - lastSignInAt <= RECENT_REAUTH_WINDOW_MS
}

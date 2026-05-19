'use client'

import { createContext, useContext } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export type ClientSessionUser = {
  id: string
  email: string | null
  name?: string | null
  role: 'user' | 'admin'
  emailVerified?: boolean
  accountType: 'user' | 'organization' | null
  organizationStatus: 'pending' | 'approved' | 'rejected' | null
  isActive?: boolean
}

export type ClientSession = {
  user: ClientSessionUser
} | null

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type AuthSessionContextValue = {
  data: ClientSession
  status: SessionStatus
  isSessionReady: boolean
  refreshSession: () => Promise<void>
}

export const AuthSessionContext = createContext<AuthSessionContextValue>({
  data: null,
  status: 'loading',
  isSessionReady: false,
  refreshSession: async () => {},
})

export function useSession() {
  return useContext(AuthSessionContext)
}

function getReadableOAuthErrorMessage(message?: string) {
  if (!message) {
    return 'Google sign-in failed'
  }

  if (/unsupported provider/i.test(message)) {
    return 'Google sign-in is not enabled in authentication settings'
  }

  return message
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = createSupabaseBrowserClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signInWithOAuth(provider: 'google', redirectTo?: string) {
  const supabase = createSupabaseBrowserClient()
  const result = await supabase.auth.signInWithOAuth({
    provider,
    options: redirectTo ? { redirectTo } : undefined,
  })

  if (result.error) {
    throw new Error(getReadableOAuthErrorMessage(result.error.message))
  }

  return result
}

export async function signOut(redirectFn?: (path: string) => void) {
  const supabase = createSupabaseBrowserClient()

  try {
    await supabase.auth.signOut()
  } catch (error) {
    console.error('[auth] Sign out error:', error)
    if (typeof window !== 'undefined') {
      try {
        Object.keys(window.localStorage).forEach((key) => {
          if (key.startsWith('sb-')) {
            window.localStorage.removeItem(key)
          }
        })
      } catch {
        // localStorage may be unavailable
      }
    }
  }

  const target = '/auth/signin'
  if (redirectFn) {
    redirectFn(target)
  } else if (typeof window !== 'undefined') {
    window.location.href = target
  }
}

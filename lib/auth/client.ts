'use client'

import { createContext, useContext } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export type ClientSessionUser = {
  id: string
  email: string | null
  name?: string | null
  role: 'user' | 'admin'
  emailVerified?: boolean
  accountType: 'user' | 'organization'
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
}

export const AuthSessionContext = createContext<AuthSessionContextValue>({
  data: null,
  status: 'loading',
})

export function useSession() {
  return useContext(AuthSessionContext)
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = createSupabaseBrowserClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signInWithOAuth(provider: 'google', redirectTo?: string) {
  const supabase = createSupabaseBrowserClient()
  return supabase.auth.signInWithOAuth({
    provider,
    options: redirectTo ? { redirectTo } : undefined,
  })
}

export async function signOut() {
  const supabase = createSupabaseBrowserClient()
  return supabase.auth.signOut()
}

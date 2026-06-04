'use client'

import { ReactNode, useMemo } from 'react'
import { AuthSessionContext } from '@/lib/auth/client'
import { useSupabaseClient } from '@/hooks/useSupabaseClient'
import { useAccountCache } from '@/hooks/useAccountCache'
import { useAuthSync } from '@/hooks/useAuthSync'
import { useSessionRefresh } from '@/hooks/useSessionRefresh'
import { usePendingOrgPoll } from '@/hooks/usePendingOrgPoll'
import { useAuthRedirects } from '@/hooks/useAuthRedirects'

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const supabase = useSupabaseClient()
  const { getAccountSnapshot, getSnapshotIsStale, clearCache } = useAccountCache(supabase)

  const { session, status, isSessionReady, refreshSession } = useAuthSync({
    supabase,
    getAccountSnapshot,
    clearCache,
  })

  useAuthRedirects({ status, isSessionReady, session })
  useSessionRefresh({ status, isSessionReady, session, getSnapshotIsStale, refreshSession })
  usePendingOrgPoll({ status, isSessionReady, session, refreshSession })

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

'use client'

import { useCallback, useRef } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

const ACCOUNT_REVALIDATE_MS = 60 * 1000

export interface AccountSnapshot {
  role: 'admin' | 'user'
  accountType: 'user' | 'organization' | null
  organizationStatus: 'pending' | 'approved' | 'rejected' | null
  isActive: boolean
  lastFetchedAt: number
}

export function useAccountCache(supabase: SupabaseClient | null) {
  const accountSnapshotRef = useRef<Map<string, AccountSnapshot>>(new Map())

  const getSnapshotIsStale = useCallback((userId: string | undefined): boolean => {
    if (!userId) return true
    const snapshot = accountSnapshotRef.current.get(userId)
    if (!snapshot) return true
    return Date.now() - snapshot.lastFetchedAt >= ACCOUNT_REVALIDATE_MS
  }, [])

  const getAccountSnapshot = useCallback(
    async (userId: string, forceRefresh = false): Promise<AccountSnapshot | null> => {
      const cached = accountSnapshotRef.current.get(userId)
      const isFresh = !!cached && Date.now() - cached.lastFetchedAt < ACCOUNT_REVALIDATE_MS
      if (cached && !forceRefresh && isFresh) return cached

      if (!supabase) return null

      const { data: account, error: accountError } = await supabase
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
        const { data: orgProfile } = await supabase
          .from('organization_profiles')
          .select('moderation_status')
          .eq('account_id', userId)
          .maybeSingle()
        organizationStatus = (orgProfile?.moderation_status as any) || null
      }

      const snapshot: AccountSnapshot = {
        role,
        accountType,
        organizationStatus,
        isActive: account.is_active ?? true,
        lastFetchedAt: Date.now(),
      }

      accountSnapshotRef.current.set(userId, snapshot)
      return snapshot
    },
    [supabase],
  )

  const clearCache = useCallback(() => {
    accountSnapshotRef.current.clear()
  }, [])

  return { getAccountSnapshot, getSnapshotIsStale, clearCache }
}

'use client'

import { useMemo } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export function useSupabaseClient() {
  return useMemo(() => {
    if (typeof window === 'undefined') return null

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) return null

    return createSupabaseBrowserClient()
  }, [])
}

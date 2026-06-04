'use client'

import { useSession } from '@/lib/auth/client'

export type AccountType = 'user' | 'organization' | 'admin'

export function useAccountType(): AccountType | null {
  const { data: session } = useSession()
  return session?.user?.accountType ?? null
}

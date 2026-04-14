'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingState } from '@/components/shared'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'

export default function OrganizationsRedirectPage() {
  const router = useRouter()
  const localePath = useLocalizedPath()

  useEffect(() => {
    router.replace(localePath('/o'))
  }, [router, localePath])

  return <LoadingState text="Yönləndirilir..." />
}

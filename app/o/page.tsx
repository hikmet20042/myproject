'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingState } from '@/components/shared'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'

export default function OrganizationsIndexRedirect() {
  const router = useRouter()
  const localePath = useLocalizedPath()

  useEffect(() => {
    router.replace(localePath('/organizations'))
  }, [router, localePath])

  return <LoadingState text="Yönləndirilir..." />
}

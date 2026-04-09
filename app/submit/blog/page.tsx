'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useSession } from '@/lib/auth/client'
import { LoadingState, UnauthorizedState } from '@/components/shared'

export default function SubmitBlogPage() { const router = useRouter()
  const { data: session, status } = useSession()
  const localePath = useLocalizedPath()

  useEffect(() => {
    if (status !== 'authenticated') return
    if (session?.user?.accountType === 'organization') return
    router.replace(localePath("/submit/blog/step1"))
  }, [router, localePath, session?.user?.accountType, status])

  if (status === 'loading') {
    return <LoadingState text="Yüklənir..." />
  }

  if (session?.user?.accountType === 'organization') {
    return (
      <UnauthorizedState
        title="Bloq paylaşımı məhduddur"
        message="Təşkilat hesabları bloq paylaşa bilməz. Bloq göndərilməsi yalnız fərdi istifadəçilər üçün aktivdir."
        actionText="Bloqlara bax"
        onAction={() => router.push(localePath('/blogs'))}
      />
    )
  }
  
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg">{'Yönləndirilir...'}</div>
    </div>
  ) }


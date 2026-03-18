'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { LoadingState } from '@/components/shared'

export default function EditBlogPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()

  const localePath = useLocalizedPath()
  const blogId = params?.id as string

  // Redirect to step 1 of edit flow
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push(localePath("/auth/signin"))
      return
    }
    
    // Set the current edit ID and redirect to step 1
    localStorage.setItem('currentEditBlogId', blogId)
    router.push(`/edit/blog/${blogId}/step1`)
  }, [session, status, blogId, router, localePath])

  return (
    <LoadingState text="Redaktə axınına yönləndirilir..." />
  )
}
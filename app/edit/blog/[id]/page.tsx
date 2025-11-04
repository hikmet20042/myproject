'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
    <LoadingState 
      text="Redirecting to edit flow..."
      gradientFrom="from-blue-50"
      gradientVia="via-indigo-50"
      gradientTo="to-purple-50"
      spinnerColor="border-blue-600"
    />
  )
}
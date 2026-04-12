'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { LoadingState } from '@/components/shared'

export default function EditBlogPage() {
  const router = useRouter()
  const params = useParams()
  const { showError } = useGlobalFeedback()
  const blogId = params?.id as string

  // Redirect to step 1 of edit flow
  useEffect(() => {
    if (!blogId) {
      showError('Redaktə ediləcək bloq tapılmadı')
      return
    }
    // Set the current edit ID and redirect to step 1
    localStorage.setItem('currentEditBlogId', blogId)
    router.push(`/edit/blog/${blogId}/step1`)
  }, [blogId, router, showError])

  return (
    <LoadingState text="Redaktə axınına yönləndirilir..." />
  )
}
'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { LoadingState } from '@/components/shared'

export default function EditBlogPage() {
  const router = useRouter()
  const params = useParams()
  const blogId = params?.id as string

  // Redirect to step 1 of edit flow
  useEffect(() => {
    // Set the current edit ID and redirect to step 1
    localStorage.setItem('currentEditBlogId', blogId)
    router.push(`/edit/blog/${blogId}/step1`)
  }, [blogId, router])

  return (
    <LoadingState text="Redaktə axınına yönləndirilir..." />
  )
}
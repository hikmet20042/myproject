'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function EditBlogPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()

  const blogId = params.id as string

  // Redirect to step 1 of edit flow
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // Set the current edit ID and redirect to step 1
    localStorage.setItem('currentEditBlogId', blogId)
    router.push(`/edit/blog/${blogId}/step1`)
  }, [session, status, blogId, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to edit flow...</p>
      </div>
    </div>
  )
}
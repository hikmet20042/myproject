'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SubmitBlogPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/submit/blog/step1')
  }, [router])
  
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg">Redirecting...</div>
    </div>
  )
}


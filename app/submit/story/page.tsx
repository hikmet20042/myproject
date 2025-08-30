'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SubmitStoryPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/submit/story/step1')
  }, [router])
  
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg">Redirecting...</div>
    </div>
  )
}


'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SubmitStoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      router.replace(`/submit/story/step1?edit=${editId}`)
    } else {
      router.replace('/submit/story/step1')
    }
  }, [router, searchParams])
  
  return null
}


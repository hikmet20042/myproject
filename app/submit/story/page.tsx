'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SubmitStoryPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/submit/story/step1')
  }, [router])
  return null
}


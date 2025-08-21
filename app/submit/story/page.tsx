'use client'

import { useRouter } from 'next/navigation'

export default function SubmitStoryPage() {
  const router = useRouter()
  router.replace('/submit/story/step1')
  return null
}


"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { LoadingState } from '@/components/shared'

export default function BlogSubmissionLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const localePath = useLocalizedPath()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    // Unauthenticated users should sign in first
    if (status === 'unauthenticated') {
      setIsRedirecting(true)
      router.replace(localePath('/auth/signin'))
      return
    }

    // /submit/blog is a regular-user-only route
    // Organizations should use /dashboard instead
    if (session?.user?.accountType === 'organization') {
      setIsRedirecting(true)
      router.push(localePath('/dashboard'))
      return
    }

    setIsRedirecting(false)
  }, [status, session?.user?.accountType, router, localePath])

  const shouldBlockRender =
    status === 'loading' ||
    isRedirecting ||
    status === 'unauthenticated' ||
    session?.user?.accountType === 'organization'

  if (shouldBlockRender) {
    return <LoadingState text={'Yüklənir...'} />
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
      {/* Removed the header section since pages have their own headers */}
      <section className="relative z-10 py-0">
        {children}
      </section>
    </div>
  )
}



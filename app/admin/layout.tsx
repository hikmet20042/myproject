'use client'

import { useSession } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { useEffect, useRef, useState } from 'react'
import { LoadingState } from '@/components/shared'

export default function AdminLayout({ children, }: { children: React.ReactNode }) { const { data: session, status } = useSession()
  const userId = session?.user?.id ?? null
  const accountType = session?.user?.accountType
  const role = session?.user?.role
  const isAdmin = role === 'admin'
  const router = useRouter()
  const routerRef = useRef(router)
  const [mounted, setMounted] = useState(false)
  const localePath = useLocalizedPath()
  const signInPath = localePath('/auth/signin?callbackUrl=/admin')
  const homePath = localePath('/')

  useEffect(() => {
    setMounted(true)
    console.debug('[admin-layout] mount')
    return () => {
      console.debug('[admin-layout] unmount')
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (status === 'loading') return

    if (status === 'authenticated' && !userId) {
      console.debug('[auth-guard][admin-layout] authenticated but userId not ready')
      return
    }

    if (status === 'authenticated' && accountType === undefined) {
      console.debug('[auth-guard][admin-layout] authenticated but accountType not ready', {
        userId,
      })
      return
    }

    if (status === 'authenticated' && role === undefined) {
      console.debug('[auth-guard][admin-layout] authenticated but role not ready', {
        userId,
      })
      return
    }

    if (status === 'unauthenticated') {
      console.debug('[auth-guard][admin-layout] redirect -> signin', {
        status,
        userId,
      })
      routerRef.current.replace(signInPath)
      return
    }

    if (status === 'authenticated' && isAdmin === false) {
      console.debug('[auth-guard][admin-layout] redirect -> home (non-admin)', {
        status,
        userId,
      })
      routerRef.current.replace(homePath)
      return
    }

    if (status === 'authenticated' && isAdmin) {
      console.debug('[auth-guard][admin-layout] fully ready', {
        status,
        userId,
        accountType,
      })
    }
  }, [accountType, homePath, isAdmin, role, signInPath, status, userId, mounted])

  if (!mounted || status === 'loading') { return (
      <LoadingState text={'Yüklənir'} />
    ) }

  if (status === 'unauthenticated') { return (
      <LoadingState text={'Yönləndirilir...'} />
    ) }

  if (status === 'authenticated' && (userId == null || accountType === undefined || role === undefined)) { return (
      <LoadingState text={'İcazələr yoxlanılır...'} />
    ) }

  if (status === 'authenticated' && isAdmin === false) { return (
      <LoadingState text={'Yönləndirilir...'} />
    ) }

  return (
  <div className="relative min-h-screen overflow-hidden bg-background">
  <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
  <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/25 blur-3xl" />
  <div className="relative z-10 border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{'İdarəetmə Paneli'}</h1>
              <p className="text-gray-600">{'icma360 platformasını idarə et'}</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600">
                {'Xoş gəldin'}, {session?.user?.name || 'İdarəçi'}
              </div>
            </div>
          </div>
        </div>
      </div>
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  ) }

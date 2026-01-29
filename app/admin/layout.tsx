'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LoadingState, ErrorState } from '@/components/shared'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const localePath = useLocalizedPath()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push(localePath('/auth/signin?callbackUrl=/admin'))
      return
    }

    if (session.user?.role !== 'admin') {
      router.push(localePath('/'))
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <LoadingState 
        text={t('common.loading')}
        gradientFrom="from-red-50"
        gradientVia="via-pink-50"
        gradientTo="to-purple-50"
        spinnerColor="border-red-600"
      />
    )
  }

  if (!session || session.user?.role !== 'admin') {
    return (
      <ErrorState 
        title={t('admin.accessDenied') || 'Access Denied'}
        message={t('admin.noPermission') || 'You do not have permission to access this area.'}
        retryText={t('common.goHome') || 'Go to Homepage'}
        onRetry={() => router.push(localePath('/'))}
      />
    )
  }

  return (
  <div className="min-h-screen bg-gray-50">
  <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
              <p className="text-gray-600">{t('admin.platformManagement')}</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600">
                {t('admin.welcome')}, {session.user?.name || t('admin.defaultName')}
              </div>
            </div>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

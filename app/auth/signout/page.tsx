'use client'

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

export default function SignOut() {
  const { t } = useLanguage()
  const localePath = useLocalizedPath()

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut({
        callbackUrl: localePath("/"),
        redirect: true
      })
    }

    handleSignOut()
  }, [localePath])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              {t('auth.signingOut')}
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              {t('auth.signedOut')}
            </p>

            <div className="mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              {t('auth.redirectingHomepage')}
            </p>

            <div className="mt-6">
              <Link href={localePath("/")}
                className="text-primary hover:text-primary-dark font-medium"
              >
                {t('auth.goToHomepageNow')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

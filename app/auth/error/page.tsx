'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

function ErrorContent() {
  const { t } = useLanguage()
  const localePath = useLocalizedPath()
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') || 'Default'
  const errorMessage = t(`auth.errors.${error}`) || t('auth.errors.Default')

  return (
  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
  <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              {t('auth.errorTitle')}
            </h2>
            
            <p className="mt-2 text-sm text-gray-600">
              {errorMessage}
            </p>
            
            {error === 'OAuthAccountNotLinked' && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  {t('auth.errors.OAuthAccountNotLinkedExtra')}
                </p>
              </div>
            )}
            
            <div className="mt-6 space-y-3">
              <Link href={localePath("/auth/signin")}
                className="block w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 text-center"
              >
                {t('auth.trySigningInAgain')}
              </Link>
              
              <Link href={localePath("/")}
                className="block text-gray-600 hover:text-primary text-sm"
              >
                ← {t('auth.returnToHomepage')}
              </Link>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-3 bg-gray-100 rounded-md">
                <p className="text-xs text-gray-600">
                  <strong>Debug info:</strong> {error}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}

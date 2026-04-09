'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'

function ErrorContent() {
  const localePath = useLocalizedPath()
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') || ''
  const errorMessages: Record<string, string> = {
    OAuthSignin: 'OAuth girişini başlatmaq alınmadı.',
    OAuthCallback: 'OAuth cavabının emalı zamanı xəta baş verdi.',
    OAuthCreateAccount: 'OAuth hesabı yaratmaq alınmadı.',
    EmailCreateAccount: 'E-poçt hesabı yaratmaq alınmadı.',
    Callback: 'Giriş callback mərhələsində xəta baş verdi.',
    OAuthAccountNotLinked: 'Bu e-poçt artıq fərqli giriş üsulu ilə əlaqələndirilib.',
    EmailSignin: 'E-poçtla giriş alınmadı.',
    CredentialsSignin: 'Giriş məlumatları etibarsızdır.',
    SessionRequired: 'Bu səhifə üçün aktiv sessiya tələb olunur.',
    Default: 'Avtorizasiya zamanı gözlənilməz xəta baş verdi.'
  }
  const errorMessage = errorMessages[error] || errorMessages.Default

  return (
    <div className="relative min-h-screen overflow-hidden bg-background py-10">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[80vh] w-full max-w-lg items-center justify-center px-4 sm:px-6">
        <div className="w-full rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-700" />
            </div>

            <h1 className="text-2xl font-black text-gray-900">{'Avtorizasiya xətası'}</h1>

            <p className="mt-2 text-sm text-gray-600">
              {errorMessage}
            </p>

            {error === 'OAuthAccountNotLinked' && (
              <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                  {'Görünür, fərqli daxil olma üsulu ilə mövcud hesabınız var. Hesabı ilk yaratdığınızda istifadə etdiyiniz eyni üsuldan istifadə edin.'}
                </p>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <Link
                href={localePath('/auth/signin')}
                className="block w-full rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                {'Yenidən daxil olmağa cəhd edin'}
              </Link>

              <Link
                href={localePath('/')}
                className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-blue-600"
              >
                <ArrowLeft className="h-4 w-4" />
                {'Ana səhifəyə qayıt'}
              </Link>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 rounded-xl bg-gray-100 p-3 text-left">
                <p className="text-xs text-gray-600">
                  <strong>{'Diaqnostika məlumatı:'}</strong> {error || 'naməlum'}
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-gray-600">
          {'Yüklənir...'}
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  )
}

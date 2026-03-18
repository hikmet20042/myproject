'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, CircleX, Loader2, MailCheck, ArrowLeft } from 'lucide-react'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

function VerifyEmailContent() {
  const localePath = useLocalizedPath()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams?.get('token')
    const verified = searchParams?.get('verified')

    if (verified === '1') {
      setStatus('success')
      setMessage('E-poçtunuz təsdiqləndi. İndi daxil ola bilərsiniz.')
      return
    }

    if (!token) {
      setStatus('error')
      setMessage('Etibarsız təsdiq keçidi')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message)
        } else {
          setStatus('error')
          setMessage(data.error || 'Təsdiq uğursuz oldu')
        }
      } catch {
        setStatus('error')
        setMessage('Təsdiq zamanı xəta baş verdi')
      }
    }

    verifyEmail()
  }, [searchParams])

  return (
    <div className="relative min-h-screen overflow-hidden bg-background py-10">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[80vh] w-full max-w-lg items-center justify-center px-4 sm:px-6">
        <div className="w-full rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <MailCheck className="h-6 w-6 text-blue-700" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">{'E-poçt təsdiqi'}</h1>
          </div>

          {status === 'loading' && (
            <div className="text-center">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">{'E-poçtunuz təsdiqlənir...'}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-700" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">{'E-poçt təsdiqləndi'}</h2>
              <p className="mb-6 text-sm text-gray-600">{message}</p>
              <Link
                href={localePath('/auth/signin')}
                className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                {'Daxil ol'}
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <CircleX className="h-6 w-6 text-red-700" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">{'Təsdiq uğursuz oldu'}</h2>
              <p className="mb-6 text-sm text-gray-600">{message}</p>

              <div className="space-y-3">
                <Link
                  href={localePath('/auth/signin')}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {'Girişə qayıt'}
                </Link>
                <Link
                  href={localePath('/auth/register')}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {'Yenidən qeydiyyat'}
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href={localePath('/')}
              className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              {'Ana səhifəyə qayıt'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-gray-600">
          {'Yuklənir...'}
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}

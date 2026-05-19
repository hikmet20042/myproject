'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, CircleX, MailCheck, ArrowLeft } from 'lucide-react'
import { Loading } from '@/components/ui/Loading'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Card, ButtonLink } from '@/components/ui'

function VerifyEmailContent() {
  const localePath = useLocalizedPath()
  const [status, setStatus] = useState<'loading' | 'pending' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const pending = searchParams?.get('pending')
    const pendingEmail = searchParams?.get('email')
    const verified = searchParams?.get('verified')
    const errorDescription = searchParams?.get('error_description')

    if (pending === '1') {
      setStatus('pending')
      setMessage(
        pendingEmail
          ? `${pendingEmail} ünvanına təsdiq linki göndərildi. Gələnlər və spam qovluğunu yoxlayın.`
          : 'Təsdiq linki e-poçtunuza göndərildi. Gələnlər və spam qovluğunu yoxlayın.'
      )
      return
    }

    if (errorDescription) {
      setStatus('error')
      setMessage(errorDescription)
      return
    }

    if (verified === '1') {
      setStatus('success')
      setMessage('E-poçtunuz təsdiqləndi. İndi daxil ola bilərsiniz.')
      return
    }

    const verifyEmail = async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data } = await supabase.auth.getUser()

        if (data?.user?.email_confirmed_at) {
          setStatus('success')
          setMessage('E-poçtunuz təsdiqləndi. İndi daxil ola bilərsiniz.')
        } else {
          setStatus('error')
          setMessage('Etibarsız təsdiq keçidi')
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
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[80vh] w-full max-w-lg items-center justify-center px-4 sm:px-6">
        <Card className="w-full rounded-3xl p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <MailCheck className="h-6 w-6 text-blue-700" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">{'E-poçt təsdiqi'}</h1>
          </div>

          {status === 'loading' && (
            <div className="text-center">
              <Loading size="lg" variant="spinner" color="primary" className="mx-auto mb-3" />
              <p className="text-sm text-slate-600">{'E-poçtunuz təsdiqlənir...'}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-700" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-slate-900">{'E-poçt təsdiqləndi'}</h2>
              <p className="mb-6 text-sm text-slate-600">{message}</p>
              <ButtonLink
                href={localePath('/auth/signin')}
                variant="primary"
                size="md"
                fullWidth
              >
                {'Daxil ol'}
              </ButtonLink>
            </div>
          )}

          {status === 'pending' && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <MailCheck className="h-6 w-6 text-amber-700" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-slate-900">{'Təsdiq e-poçtu göndərildi'}</h2>
              <p className="mb-6 text-sm text-slate-600">{message}</p>
              <div className="space-y-3">
                <ButtonLink
                  href={localePath('/auth/signin')}
                  variant="primary"
                  size="md"
                  fullWidth
                >
                  {'Girişə keç'}
                </ButtonLink>
                <ButtonLink
                  href={localePath('/auth/verify-request')}
                  variant="outline"
                  size="md"
                  fullWidth
                >
                  {'Təsdiq e-poçtunu yenidən göndər'}
                </ButtonLink>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <CircleX className="h-6 w-6 text-red-700" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-slate-900">{'Təsdiq uğursuz oldu'}</h2>
              <p className="mb-6 text-sm text-slate-600">{message}</p>

              <div className="space-y-3">
                <ButtonLink
                  href={localePath('/auth/signin')}
                  variant="primary"
                  size="md"
                  fullWidth
                >
                  {'Girişə qayıt'}
                </ButtonLink>
                <ButtonLink
                  href={localePath('/auth/register')}
                  variant="outline"
                  size="md"
                  fullWidth
                >
                  {'Yenidən qeydiyyat'}
                </ButtonLink>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href={localePath('/')}
              className="inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              {'Ana səhifəyə qayıt'}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-slate-600">
          {'Yüklənir...'}
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}

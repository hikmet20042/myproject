'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { Input, Button } from '@/components/ui'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

function ResetPasswordContent() {
  const localePath = useLocalizedPath()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isRecoveryReady, setIsRecoveryReady] = useState(false)
  const [isCheckingRecovery, setIsCheckingRecovery] = useState(true)
  const [recoveryEmail, setRecoveryEmail] = useState('')

  const router = useRouter()

  useEffect(() => {
    let isCancelled = false

    const updateFromSession = async () => {
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()

      if (isCancelled) {
        return false
      }

      const user = data.session?.user
      if (!user) {
        return false
      }

      setRecoveryEmail(user.email || '')
      setError('')
      setIsRecoveryReady(true)
      setIsCheckingRecovery(false)
      return true
    }

    const ensureRecoverySession = async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        if (await updateFromSession()) {
          return
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (isCancelled) {
            return
          }

          if (session?.user) {
            setRecoveryEmail(session.user.email || '')
            setError('')
            setIsRecoveryReady(true)
            setIsCheckingRecovery(false)
          }
        })

        const timeout = window.setTimeout(async () => {
          if (isCancelled || isRecoveryReady) {
            return
          }

          const found = await updateFromSession()
          if (!found) {
            setError('Etibarsız sıfırlama keçidi. Zəhmət olmasa yeni şifrə sıfırlama tələb edin.')
            setIsRecoveryReady(false)
            setIsCheckingRecovery(false)
          }
        }, 3000)

        return () => {
          subscription.unsubscribe()
          window.clearTimeout(timeout)
        }
      } catch {
        if (isCancelled) {
          return
        }

        setError('Etibarsız sıfırlama keçidi. Zəhmət olmasa yeni şifrə sıfırlama tələb edin.')
        setIsRecoveryReady(false)
        setIsCheckingRecovery(false)
      }
    }

    let cleanup: (() => void) | undefined
    void ensureRecoverySession().then((fn) => {
      cleanup = fn
    })

    return () => {
      isCancelled = true
      cleanup?.()
    }
  }, [isRecoveryReady])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    if (!isRecoveryReady) {
      setError('Etibarsız sıfırlama keçidi. Zəhmət olmasa yeni şifrə sıfırlama tələb edin.')
      setIsLoading(false)
      return
    }

    // Validation
    if (password.length < 6) {
      setError('Şifrə ən azı 6 simvol uzunluğunda olmalıdır')
      setIsLoading(false)
      return }

    if (password !== confirmPassword) {
      setError('Şifrələr uyğun gəlmir')
      setIsLoading(false)
      return }

    try {
      const supabase = createSupabaseBrowserClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (!updateError) {
        setMessage('Password has been reset successfully')
        await supabase.auth.signOut()
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push(localePath('/auth/signin?message=Şifrə uğurla sıfırlandı. Yeni şifrənlə daxil ol.'))
        }, 3000)
      } else {
        setError(updateError.message || 'Nəsə səhv oldu')
      }
    } catch {
      setError('Şəbəkə xətası. Zəhmət olmasa yenidən cəhd edin.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingRecovery) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background py-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="relative z-10 mx-auto flex min-h-[80vh] w-full max-w-lg items-center justify-center px-4 sm:px-6">
          <div className="w-full rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">{'Sıfırlama sessiyası hazırlanır...'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isRecoveryReady) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background py-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="relative z-10 mx-auto flex min-h-[80vh] w-full max-w-lg items-center justify-center px-4 sm:px-6">
          <div className="w-full rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <h1 className="text-2xl font-black text-gray-900">{'Etibarsız sıfırlama keçidi'}</h1>
            <p className="mt-3 text-sm text-gray-600">
              {error || 'Bu şifrə sıfırlama keçidi etibarsızdır və ya müddəti bitib.'}
            </p>
            <Link
              href={localePath('/auth/forgot-password')}
              className="mt-6 inline-block text-sm font-medium text-blue-600 transition-colors hover:text-blue-500"
            >
              {'Yeni şifrə sıfırlama tələb edin'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background py-10">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[80vh] w-full max-w-lg items-center justify-center px-4 sm:px-6">
        <div className="w-full rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Lock className="h-6 w-6 text-blue-700" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">{'Şifrəni sıfırla'}</h1>
            <p className="mt-2 text-sm text-gray-600">
              {`${recoveryEmail} üçün yeni şifrə daxil edin`}
            </p>
          </div>

          {message && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <p>{message}</p>
              <p className="mt-1">{'Giriş səhifəsinə yönləndirilir...'}</p>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {'Yeni şifrə'}
              </label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={'Yeni şifrə daxil edin'}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">{'Ən azı 6 simvol olmalıdır'}</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {'Yeni şifrəni təsdiqlə'}
              </label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={'Yeni şifrəni təsdiqləyin'}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isLoading || !password.trim() || !confirmPassword.trim()}
              loading={isLoading}
            >
              {'Şifrəni sıfırla'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href={localePath('/auth/signin')}
              className="text-sm text-gray-600 transition-colors hover:text-blue-600"
            >
              {'Girişə qayıt'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}

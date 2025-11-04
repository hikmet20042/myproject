'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { Input, Button } from '@/components/ui'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

function ResetPasswordContent() {
  const { t } = useLanguage()
  const localePath = useLocalizedPath()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tokenParam = searchParams?.get('token')
    const emailParam = searchParams?.get('email')
    
    if (!tokenParam || !emailParam) {
      setError(t('resetPassword.invalidLink'))
      return
    }
    
    setToken(tokenParam)
    setEmail(decodeURIComponent(emailParam))
  }, [searchParams, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    // Validation
    if (password.length < 6) {
      setError(t('resetPassword.passwordTooShort'))
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t('resetPassword.passwordsDoNotMatch'))
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push(localePath("/auth/signin?message=Password reset successful. Please sign in with your new password."))
        }, 3000)
      } else {
        setError(data.error || t('resetPassword.somethingWentWrong'))
      }
    } catch (error) {
      setError(t('resetPassword.networkError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b text-center">
            <h1 className="text-2xl font-bold text-red-600">{t('resetPassword.invalidResetLink')}</h1>
          </div>
          <div className="p-6 text-center">
            <p className="text-gray-600 mb-4">
              {t('resetPassword.linkInvalidOrExpired')}
            </p>
            <Link href={localePath("/auth/forgot-password")}
              className="text-red-600 hover:text-red-500 font-medium"
            >
              {t('resetPassword.requestNewReset')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('resetPassword.title')}</h1>
            <p className="text-gray-600 mt-2">
              {t('resetPassword.enterNewPassword', { email })}
            </p>
          </div>
          <div className="p-6">
            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800">
                  {message}
                  <div className="mt-2 text-sm">
                    {t('resetPassword.redirecting')}
                  </div>
                </p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('resetPassword.newPassword')}</label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('resetPassword.newPasswordPlaceholder')}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('resetPassword.passwordMinLength')}
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">{t('resetPassword.confirmNewPassword')}</label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
                {t('resetPassword.resetPasswordButton')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href={localePath("/auth/signin")}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {t('resetPassword.backToSignIn')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  const localePath = useLocalizedPath()
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
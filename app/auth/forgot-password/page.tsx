'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { Input, Button } from '@/components/ui'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      
  const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setEmail('') // Clear the form
      } else {
        setError(data.error || t('forgotPassword.somethingWentWrong'))
      }
    } catch (error) {
      setError(t('forgotPassword.networkError'))
    } finally {
      setIsLoading(false)
    }
  }
  const localePath = useLocalizedPath();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href={localePath("/auth/signin")}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('forgotPassword.backToSignIn')}
          </Link>
        </div>

        <div className="w-full max-w-md bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('forgotPassword.title')}</h1>
            <p className="text-gray-600 mt-2">
              {t('forgotPassword.description')}
            </p>
          </div>
          <div className="p-6">
            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800">
                  {message}
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('forgotPassword.emailAddress')}</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isLoading || !email.trim()}
                loading={isLoading}
              >
                {t('forgotPassword.sendResetLink')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t('forgotPassword.rememberPassword')}{' '}
                <Link href={localePath("/auth/signin")}
                  className="font-medium text-red-600 hover:text-red-500"
                >
                  {t('forgotPassword.signInHere')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
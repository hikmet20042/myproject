'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { Input, Button } from '@/components/ui'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const localePath = useLocalizedPath()

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
        body: JSON.stringify({ email: email.trim() }),
      })
      const payload = await response.json()

      if (!response.ok) {
        setError(payload?.error?.message || 'Nəsə səhv oldu')
        return
      }

      setMessage(payload?.data?.message || 'If an account with that email exists, a password reset link has been sent.')
      setEmail('')
    } catch {
      setError('Şəbəkə xətası. Zəhmət olmasa yenidən cəhd edin.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background py-10">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[80vh] w-full max-w-lg items-center justify-center px-4 sm:px-6">
        <div className="w-full rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <Link
            href={localePath('/auth/signin')}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            {'Girişə qayıt'}
          </Link>

          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-6 w-6 text-blue-700" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">{'Şifrəni unutmusunuz?'}</h1>
            <p className="mt-2 text-sm text-gray-600">
              {'E-poçt ünvanınızı daxil edin və şifrəni sıfırlamaq üçün keçid göndərək.'}
            </p>
          </div>

          {message && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {'E-poçt ünvanı'}
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={'E-poçt ünvanınızı daxil edin'}
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
              {'Sıfırlama keçidi göndər'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            {'Şifrənizi xatırlayırsınız?'}{' '}
            <Link
              href={localePath('/auth/signin')}
              className="font-medium text-blue-600 transition-colors hover:text-blue-500"
            >
              {'Buradan daxil olun'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { Input, Button } from '@/components/ui'

export default function VerifyRequest() {
  const localePath = useLocalizedPath()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/verify-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })
      const payload = await response.json()

      if (!response.ok) {
        setError(payload?.error?.message || 'Təsdiq e-poçtu göndərilmədi')
        return
      }

      setMessage(payload?.data?.message || 'Təsdiq e-poçtu göndərildi. Gələnlər qutunu yoxla.')
      setEmail('')
    } catch {
      setError('Təsdiq e-poçtu göndərilmədi')
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
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-6 w-6 text-blue-700" />
            </div>

            <h1 className="text-2xl font-black text-gray-900">
              {'E-poçtunuzu yoxlayın'}
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              {'Təsdiq e-poçtu göndərmək üçün e-poçt ünvanını daxil edin.'}
            </p>

            {message && (
              <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                {message}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-left text-sm font-medium text-gray-700">
                  {'E-poçt ünvanı'}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={'E-poçt ünvanınızı daxil edin'}
                  required
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isLoading}
                disabled={isLoading || !email.trim()}
              >
                {'Təsdiq e-poçtu göndər'}
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <Link
                href={localePath('/auth/signin')}
                className="inline-block text-sm font-medium text-blue-600 transition-colors hover:text-blue-500"
              >
                {'Başqa e-poçt sınayın'}
              </Link>

              <div>
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
      </div>
    </div>
  )
}

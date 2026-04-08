'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Input, Button } from '@/components/ui'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { signInWithOAuth } from '@/lib/auth/client'
import Logo from '@/components/Logo'

export default function RegisterPage() {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const waitForSession = async (timeoutMs = 3000, intervalMs = 250) => {
    const supabase = createSupabaseBrowserClient()
    const startedAt = Date.now()

    while (Date.now() - startedAt < timeoutMs) {
      const { data } = await supabase.auth.getSession()
      if (data?.session) return true
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
    return false
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const nextErrors: { [key: string]: string } = {}
    if (!formData.email.trim()) {
      nextErrors.email = 'E-poçt tələb olunur'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Etibarlı e-poçt ünvanı daxil et'
    }

    if (!formData.password) {
      nextErrors.password = 'Şifrə tələb olunur'
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Şifrə ən azı 6 simvoldan ibarət olmalıdır'
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Şifrəni təsdiqlə'
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Şifrələr uyğun gəlmir'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setErrors({})
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setErrors({ submit: data.error || 'Qeydiyyat alınmadı' })
        return
      }

      setIsRedirecting(true)
      const hasSession = await waitForSession(3000, 250)
      if (hasSession) {
        router.replace(localePath('/onboarding/role'))
        return
      }

      setIsRedirecting(false)
      setErrors({ submit: 'Sessiya yaradılmadı. Zəhmət olmasa daxil olun.' })
      setTimeout(() => {
        router.replace(localePath('/auth/signin'))
      }, 1200)
    } catch {
      setErrors({ submit: 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.' })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true)
      setErrors({})
      await signInWithOAuth(
        'google',
        `${window.location.origin}/auth/callback?next=${encodeURIComponent(localePath('/onboarding/role'))}`,
      )
    } catch (error: any) {
      setErrors({ submit: error?.message || 'Google ilə davam etmə zamanı xəta baş verdi.' })
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="flex justify-center">
            <Logo href={localePath('/')} size="md" variant="dark" showText={false} showTagline={false} />
          </div>
          <h1 className="mt-6 text-3xl font-black text-gray-900">{'Hesab yarat'}</h1>
          <p className="mt-2 text-sm text-gray-600">{'Qeydiyyatı tamamla və onboarding mərhələsinə keç.'}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          {isRedirecting && (
            <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              Hesab yaradıldı, yönləndirilir...
            </div>
          )}
          {errors.submit && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errors.submit}
            </div>
          )}

          <div className="mb-6">
            <Button
              onClick={handleGoogleSignUp}
              variant="outline"
              fullWidth
              className="justify-center items-center"
              disabled={googleLoading || loading || isRedirecting}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoading ? 'Google yönləndirilir...' : 'Google ilə davam et'}
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                {'Və ya e-poçt ilə qeydiyyat'}
              </span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">{'E-poçt ünvanı'}</label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder={'E-poçt ünvanını daxil et'}
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  icon={Mail}
                  inputSize="md"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">{'Şifrə'}</label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={'Şifrə (minimum 6 simvol)'}
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  icon={Lock}
                  inputSize="md"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">{'Şifrəni təsdiq et'}</label>
              <div className="mt-1 relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder={'Şifrəni təkrar daxil et'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  icon={Lock}
                  inputSize="md"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" disabled={loading || isRedirecting || googleLoading} variant="primary" fullWidth loading={loading || isRedirecting}>
              {isRedirecting ? 'Yönləndirilir...' : loading ? 'Qeydiyyat aparılır...' : 'Davam et'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {'Artıq hesabın var?'}{' '}
            <Link href={localePath('/auth/signin')} className="font-medium text-blue-600 hover:text-blue-500">
              {'Daxil ol'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

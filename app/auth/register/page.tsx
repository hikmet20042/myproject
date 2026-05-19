'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Input, Button, Card } from '@/components/ui'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { signInWithOAuth } from '@/lib/auth/client'
import Logo from '@/components/Logo'

export default function RegisterPage() {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { showError, showInfo } = useGlobalFeedback()
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
  const listenerRef = useRef<ReturnType<typeof supabase.auth.onAuthStateChange> | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    if (errors.submit) showError(errors.submit)
  }, [errors.submit, showError])

  useEffect(() => {
    if (isRedirecting) showInfo('Hesab yaradıldı, yönləndirilir...')
  }, [isRedirecting, showInfo])

  useEffect(() => {
    return () => {
      listenerRef.current?.data.subscription.unsubscribe()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const waitForSessionWithListener = (onTimeout: () => void) => {
    listenerRef.current = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        listenerRef.current?.data.subscription.unsubscribe()
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        router.replace(localePath('/onboarding/role'))
      }
    })

    timeoutRef.current = setTimeout(() => {
      listenerRef.current?.data.subscription.unsubscribe()
      onTimeout()
    }, 5000)
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
      waitForSessionWithListener(() => {
        const pendingEmail = encodeURIComponent(formData.email.trim().toLowerCase())
        router.replace(localePath(`/auth/verify-email?pending=1&email=${pendingEmail}`))
      })
    } catch {
      setErrors({ submit: 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.' })
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
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 text-slate-900 sm:py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute bottom-[-4rem] left-[-4rem] h-72 w-72 rounded-full bg-indigo-100/70 blur-3xl" />
      </div>

      <Card className="mx-auto w-full max-w-5xl rounded-3xl shadow-xl shadow-slate-200/60">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          <aside className="hidden border-r border-slate-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <Logo href={localePath('/')} size="lg" variant="dark" showText={false} showTagline={false} />
              <h2 className="mt-8 text-4xl font-black leading-tight text-slate-900">Yeni başlanğıca hazır ol</h2>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-slate-600">
                Qeydiyyatı tamamla, maraq sahələrini seç və icma ilə inkişaf yoluna başla.
              </p>
            </div>
            <Card className="rounded-2xl bg-white/90 p-5 backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Sürətli başlanğıc</p>
              <p className="mt-2 text-sm text-slate-600">
                Hesabını yaratdıqdan sonra onboarding addımları ilə profilini fərdiləşdirə bilərsən.
              </p>
            </Card>
          </aside>

          <section className="p-6 sm:p-10">
            <div className="mb-8 text-center">
              <div className="flex justify-center lg:hidden">
                <Logo href={localePath('/')} size="md" variant="dark" showText={false} showTagline={false} />
              </div>
              <h1 className="mt-6 text-3xl font-black text-slate-900">{'Hesab yarat'}</h1>
              <p className="mt-2 text-sm text-slate-600">{'Qeydiyyatı tamamla və onboarding mərhələsinə keç.'}</p>
            </div>

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
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">
                {'Və ya e-poçt ilə qeydiyyat'}
              </span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700">{'E-poçt ünvanı'}</label>
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
              <label htmlFor="password" className="block text-sm font-bold text-slate-700">{'Şifrə'}</label>
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
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword((v) => !v)}
                  icon={showPassword ? EyeOff : Eye}
                />
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700">{'Şifrəni təsdiq et'}</label>
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
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  icon={showConfirmPassword ? EyeOff : Eye}
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" disabled={loading || isRedirecting || googleLoading} variant="primary" fullWidth loading={loading || isRedirecting}>
              {isRedirecting ? 'Yönləndirilir...' : loading ? 'Qeydiyyat aparılır...' : 'Davam et'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            {'Artıq hesabın var?'}{' '}
            <Link href={localePath('/auth/signin')} className="font-bold text-blue-600 hover:text-blue-500">
              {'Daxil ol'}
            </Link>
          </div>
          </section>
        </div>
      </Card>
    </div>
  )
}

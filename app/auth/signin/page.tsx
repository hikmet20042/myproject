'use client'

import { useState, Suspense } from 'react'
import { Eye, EyeOff, Mail, Lock, Shield, Sparkles, Heart, Users, ArrowRight, CheckCircle, User, Building } from 'lucide-react'
import { signInWithOAuth, signInWithPassword } from '@/lib/auth/client'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input, Button } from '@/components/ui'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import Logo from '@/components/Logo'


function SignInContent() {
  const localePath = useLocalizedPath();
  const [formData, setFormData] = useState({ email: '',
    password: '',
    accountType: 'user' })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackUrl = searchParams?.get('callbackUrl') || '/'
  const urlError = searchParams?.get('error')
  const urlMessage = searchParams?.get('message')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target
    setFormData(prev => ({ ...prev,
      [name]: value }))
    setError('') }

  const handleCredentialsSignIn = async (e: React.FormEvent) => { e.preventDefault()
    setLoading(true)
    setError('')

    try { const emailValid = /\S+@\S+\.\S+/.test(formData.email)
      if (!emailValid) { setError('E-poçt formatı yanlışdır')
        setLoading(false)
        return }
      if (!formData.password || formData.password.length < 6) { setError('Şifrə ən azı 6 simvol olmalıdır')
        setLoading(false)
        return }
      const result = await signInWithPassword(formData.email, formData.password)

      if (result.error) { setError(result.error.message)
        setLoading(false)
        return }
      const signedInUserId = result.data.user?.id
      const supabase = createSupabaseBrowserClient()
      let accountType = 'user'

      if (signedInUserId) {
        const { data: account } = await supabase
          .from('accounts')
          .select('account_type')
          .eq('id', signedInUserId)
          .maybeSingle()
        accountType = (account?.account_type as string) || 'user'
      }

      if (accountType !== formData.accountType) { setError(
          formData.accountType === 'organization'
            ? 'Aşağıda "Təşkilat" hesab növünü seç və şifrənlə daxil ol.'
            : 'Yanlış e-poçt və ya şifrə'
        )
        setLoading(false)
        return }

      try {
        const targetUrl = new URL(callbackUrl, window.location.origin)
        if (targetUrl.origin === window.location.origin) {
          router.replace(`${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`)
        } else {
          window.location.href = callbackUrl
        }
      } catch {
        if (callbackUrl.startsWith('/')) {
          router.replace(callbackUrl)
        } else {
          window.location.href = callbackUrl
        }
      }
    } catch (error: any) { // Catch any thrown errors and display them
      setError(error?.message || 'Daxil olma zamanı xəta baş verdi')
      setLoading(false) } }

  const handleGoogleSignIn = async () => { try { setGoogleLoading(true)
      await signInWithOAuth('google', `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`) } catch (error: any) { // Catch Google OAuth errors
      setError(error?.message || 'Google ilə daxil olma zamanı xəta baş verdi') } finally { setGoogleLoading(false) } }

  return (
    <div className="min-h-screen bg-background text-foreground lg:bg-white flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="w-full max-w-md mx-auto lg:mx-0">
          {/* Logo and Header */}
          <div className="mb-8 sm:mb-10 animate-fade-in">
            <Logo
              href={localePath("/")}
              size="md"
              variant="dark"
              showText={false}
              showTagline={false}
              className="mb-6 sm:mb-8"
            />



            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2 sm:mb-3">
              {'Hesabına daxil ol'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {'icma360 ilə əlaqə qur, öyrən və inkişaf et'}
            </p>
          </div>
          {/* Form Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 animate-fade-in animation-delay-200">
            {(error || urlError) && (
              <div className="mb-4">
                {/* Email verification error - special styling */}
                {(error === 'Daxil olmadan əvvəl e-poçtunu təsdiqlə' || urlError === 'Verification') ? (
                  <div className="bg-yellow-50 border border-yellow-300 rounded-md p-4 flex items-center">
                    <svg className="h-6 w-6 text-yellow-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                    <div className="text-sm text-yellow-800">
                      <strong>{'E-poçt təsdiqlənməyib.'}</strong> {'Təsdiq e-poçtu üçün gələnlər qutusunu (və spam qovluğunu) yoxla.'} <br />
                      <span className="block mt-1">{'Daxil olmadan əvvəl e-poçtunu təsdiqləməlisən.'} <Link href={localePath("/auth/verify-request")} className="underline text-blue-600">{'Təsdiq e-poçtunu yenidən göndər'}</Link></span>
                    </div>
                  </div>
                ) :
                  /* Provider mismatch errors - informational styling */
                  (error?.includes('Bu hesab Google ilə yaradılıb') || error?.includes('Bu hesab e-poçt/şifrə ilə yaradılıb')) ? (
                    <div className="bg-blue-50 border border-blue-300 rounded-md p-4">
                      <div className="flex items-start">
                        <svg className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-blue-800">
                          <strong>{'Hesab Daxil Olma Üsulu'}</strong>
                          <p className="mt-1">{error}</p>
                        </div>
                      </div>
                    </div>
                  ) :
                    /* Organization restriction error - informational styling */
                    error?.includes('This email is registered as an organization') ? (
                      <div className="bg-blue-50 border border-blue-300 rounded-md p-4">
                        <div className="flex items-start">
                          <svg className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <div className="text-sm text-blue-800">
                            <strong>{'Təşkilat Hesabı'}</strong>
                            <p className="mt-1">{error}</p>
                            <p className="mt-2">{'Aşağıda "Təşkilat" hesab növünü seç və şifrənlə daxil ol.'}</p>
                          </div>
                        </div>
                      </div>
                    ) :
                      /* Generic error - red styling */
                      (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                          <div className="text-sm text-red-600">
                            {error ||
                              (urlError === 'CredentialsSignin' ? 'Yanlış e-poçt və ya şifrə' :
                                urlError === 'OAuthSignin' ? 'Google ilə daxil olma xətası' :
                                  urlError === 'Verification' ? 'Daxil olmadan əvvəl e-poçtunu təsdiqlə' :
                                    'Daxil olma zamanı xəta baş verdi')}
                          </div>
                        </div>
                      )}
              </div>
            )}
            {(!error && !urlError && urlMessage) && (
              <div className="mb-4">
                <div className="bg-blue-50 border border-blue-300 rounded-md p-4">
                  <div className="text-sm text-blue-800">
                    {urlMessage}
                  </div>
                </div>
              </div>
            )}

            {/* Google Sign In */}
            <div className="mb-6">
              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                fullWidth
                className="justify-center items-center"
                disabled={googleLoading || loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {'Google ilə davam et'}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {'Və ya e-poçt ilə daxil ol'}
                </span>
              </div>
            </div>

            {/* Credentials Sign In */}
            <form className="mt-6 space-y-5" onSubmit={handleCredentialsSignIn} autoComplete="off">
              <div className="space-y-5">
                {/* Account Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{'Hesab Növü'}</label>
                  <div className="rounded-xl border border-gray-200 bg-white p-1">
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, accountType: 'user' }))}
                        className={`flex items-center justify-center px-4 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${formData.accountType === 'user'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50' }`}
                      >
                        <User className="w-4 h-4 mr-2" />
                        {'Fərdi İstifadəçi'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, accountType: 'organization' }))}
                        className={`flex items-center justify-center px-4 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${formData.accountType === 'organization'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50' }`}
                      >
                        <Building className="w-4 h-4 mr-2" />
                        {'Təşkilat'}
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">{'E-poçt ünvanı'}</label>
                  <div className="mt-1">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={'E-poçt ünvanını daxil et'}
                      icon={Mail}
                      inputSize="md"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">{'Şifrə'}</label>
                  <div className="mt-1 relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={'Şifrəni daxil et'}
                      icon={Lock}
                      inputSize="md"
                    />
                    <button type="button" tabIndex={-1} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end mt-4">
                <Link href={localePath("/auth/forgot-password")}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {'Şifrəni unutmusunuz?'}
                </Link>
              </div>

              <div className="mt-6">
                <Button
                  type="submit"
                  disabled={loading || !formData.email || !formData.password}
                  variant="primary"
                  fullWidth
                  loading={loading}
                >
                  {loading ? 'Daxil olunur...' : 'Daxil ol'}
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {'Hesabın yoxdur?'}{' '}
                  <Link href={localePath("/auth/register")}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    {'Buradan yarat'}
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href={localePath("/")}
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors group"
              >
                <span>←</span>
                <span className="group-hover:translate-x-1 transition-transform">{'Ana səhifəyə qayıt'}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Context Panel (Hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden border-l border-gray-200 bg-slate-50">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-12">
          <div className="max-w-lg">


            <h2 className="mb-6 text-3xl font-black text-gray-900 xl:text-4xl">
              {'İcmamıza yenidən xoş gəldin'}
            </h2>

            <p className="mb-8 text-lg leading-relaxed text-gray-600">
              {'İmkanları kəşf et, icmanla əlaqə qur və töhfə verməyə davam et.'}
            </p>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              {[
                { icon: Shield, text: 'Təhlükəsiz və məxfi platforma' },
                { icon: Users, text: 'Dəyişiklik yaradanların böyüyən icması' },
                { icon: Heart, text: 'Həqiqi fərq yarat' }
              ].map((feature, idx) => (
                <div key={idx} className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-3 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-medium text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '10K+', label: 'Aktiv istifadəçi' },
                { value: '500+', label: 'Təşkilat tərəfdaşı' },
                { value: '24/7', label: 'Dəstək' }
              ].map((stat, idx) => (
                <div key={idx} className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm animate-fade-in" style={{ animationDelay: `${(idx + 3) * 0.1}s` }}>
                  <div className="mb-1 text-2xl font-black text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) }

export default function SignIn() { return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yüklənir...</div>}>
      <SignInContent />
    </Suspense>
  ) }

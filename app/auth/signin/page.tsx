'use client'

import { useState, Suspense } from 'react'
import { Eye, EyeOff, Mail, Lock, Shield, Sparkles, Heart, Users, ArrowRight, CheckCircle } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input, Button } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'
import { AnimatedBackground } from '@/components/shared'
import { useLocalizedPath } from '@/lib/useLocalizedPath'


function SignInContent() {
  const { t } = useLanguage();
  const localePath = useLocalizedPath();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    accountType: 'user'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackUrl = searchParams?.get('callbackUrl') || '/'
  const urlError = searchParams?.get('error')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        accountType: formData.accountType,
        redirect: false,
      })

      if (result?.error) {
        // Display the actual error message from the auth provider
        setError(result.error)
      } else if (result?.ok) {
        router.push(callbackUrl)
      }
    } catch (error: any) {
      // Catch any thrown errors and display them
      setError(error?.message || 'An error occurred during sign-in')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', { callbackUrl })
    } catch (error: any) {
      // Catch Google OAuth errors
      setError(error?.message || 'An error occurred with Google sign-in')
    }
  }

  return (
  <div className="min-h-screen bg-gray-50 lg:bg-white flex">
    {/* Left Side - Form */}
    <div className="flex-1 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
      <div className="w-full max-w-md mx-auto lg:mx-0">
        {/* Logo and Header */}
        <div className="mb-8 sm:mb-10 animate-fade-in">
          <Link href={localePath("/")} className="inline-flex items-center gap-2 mb-6 sm:mb-8 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-base sm:text-lg">GE</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">{t('common.platformName')}</span>
          </Link>
          
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100 rounded-full mb-3 sm:mb-4">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-xs sm:text-sm font-bold text-blue-600 uppercase tracking-wide">{t('auth.welcomeBack')}</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2 sm:mb-3">
            {t('auth.signIn')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {t('auth.signInSubtitle')}
          </p>
        </div>
        {/* Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border-2 border-gray-200 animate-fade-in animation-delay-200">
          {(error || urlError) && (
            <div className="mb-4">
              {/* Email verification error - special styling */}
              {(error === 'Please verify your email before signing in' || urlError === 'Verification') ? (
                <div className="bg-yellow-50 border border-yellow-300 rounded-md p-4 flex items-center">
                  <svg className="h-6 w-6 text-yellow-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <strong>{t('auth.emailNotVerified')}</strong> {t('auth.checkInboxSpam')} <br />
                    <span className="block mt-1">{t('auth.mustVerifyEmail')} <Link href={localePath("/auth/verify-request")} className="underline text-blue-600">{t('auth.resendVerification')}</Link></span>
                  </div>
                </div>
              ) : 
              /* Provider mismatch errors - informational styling */
              (error?.includes('This account was created with Google') || error?.includes('This account was created with email/password')) ? (
                <div className="bg-blue-50 border border-blue-300 rounded-md p-4">
                  <div className="flex items-start">
                    <svg className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <strong>{t('auth.accountSignInMethod')}</strong>
                      <p className="mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              ) : 
              /* NGO restriction error - informational styling */
              error?.includes('This email is registered as an NGO') ? (
                <div className="bg-blue-50 border border-blue-300 rounded-md p-4">
                  <div className="flex items-start">
                    <svg className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <strong>{t('auth.ngoAccount')}</strong>
                      <p className="mt-1">{error}</p>
                      <p className="mt-2">{t('auth.selectNGOType')}</p>
                    </div>
                  </div>
                </div>
              ) : 
              /* Generic error - red styling */
              (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-sm text-red-600">
                    {error || 
                      (urlError === 'CredentialsSignin' ? t('auth.invalidCredentials') : 
                        urlError === 'OAuthSignin' ? t('auth.googleSignInError') :
                        urlError === 'Verification' ? t('auth.verifyEmailBeforeSignIn') :
                        t('auth.errorOccurred'))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Google Sign In */}
          <div className="mb-6">
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              fullWidth
              className="justify-center items-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('auth.continueWithGoogle')}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                {t('auth.orSignInEmail')}
              </span>
            </div>
          </div>

          {/* Credentials Sign In */}
          <form className="mt-6 space-y-5" onSubmit={handleCredentialsSignIn} autoComplete="off">
            <div className="space-y-5">
              {/* Account Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.accountType')}</label>
                <div className="flex space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="accountType"
                      value="user"
                      checked={formData.accountType === 'user'}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{t('auth.individualUser')}</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="accountType"
                      value="ngo"
                      checked={formData.accountType === 'ngo'}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{t('auth.ngoOrganization')}</span>
                  </label>
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('auth.emailAddress')}</label>
                <div className="mt-1">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('auth.enterEmail')}
                    icon={Mail}
                    inputSize="md"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('auth.password')}</label>
                <div className="mt-1 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t('auth.enterPassword')}
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
                {t('auth.forgotPassword')}
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
                {loading ? t('auth.signingIn') : t('auth.signInButton')}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {t('auth.dontHaveAccount')}{' '}
                <Link href={localePath("/auth/register")}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  {t('auth.createOneHere')}
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href={localePath("/")}
              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors group"
            >
              <span>←</span>
              <span className="group-hover:translate-x-1 transition-transform">{t('auth.backToHomepage')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>

    {/* Right Side - Engaging Visual Panel (Hidden on mobile) */}
    <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <AnimatedBackground
        colors={{
          blob1: 'bg-pink-500',
          blob2: 'bg-blue-400',
          blob3: 'bg-purple-500'
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-12">
        <div className="max-w-lg">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-6">
            <Sparkles className="w-5 h-5 text-blue-300" />
            <span className="text-sm font-bold text-white uppercase tracking-wide">Join Our Community</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-black text-white mb-6">
            {t('auth.signInWelcome')}
          </h2>
          
          <p className="text-lg text-blue-100 mb-8 leading-relaxed">
            {t('auth.signInDescription')}
          </p>

          {/* Features List */}
          <div className="space-y-4 mb-8">
            {[
              { icon: Shield, text: t('auth.feature1') || 'Secure and Private Platform' },
              { icon: Users, text: t('auth.feature2') || 'Growing Community of Change-makers' },
              { icon: Heart, text: t('auth.feature3') || 'Make a Real Difference' }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-4 group animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-blue-300" />
                </div>
                <span className="text-white font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '10K+', label: t('auth.stat1') || 'Active Users' },
              { value: '500+', label: t('auth.stat2') || 'NGO Partners' },
              { value: '24/7', label: t('auth.stat3') || 'Support' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center animate-fade-in" style={{ animationDelay: `${(idx + 3) * 0.1}s` }}>
                <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-xs text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}

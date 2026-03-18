'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithOAuth } from '@/lib/auth/client'
import { Eye, EyeOff, User, Mail, Lock, Building, Globe, Phone, MapPin, FileText, Tag, Users, Shield, Sparkles, Heart, CheckCircle, ArrowRight } from 'lucide-react'
import { Input, Button, TextArea } from '@/components/ui'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import Logo from '@/components/Logo'
import { ORGANIZATION_TYPE_LABELS, ORGANIZATION_TYPE_VALUES } from '@/lib/organizationTypes'

export default function RegisterPage() {
  const router = useRouter()
  const [registrationType, setRegistrationType] = useState<'user' | 'organization'>('user')
  
  // Focus areas with translation keys
  const localePath = useLocalizedPath()
  const focusAreasOptions = [
    { key: 'Human Rights', label: 'İnsan Hüquqları' },
    { key: 'Women Rights', label: 'Qadın Hüquqları' },
    { key: 'Children Rights', label: 'Uşaq Hüquqları' },
    { key: 'Education', label: 'Təhsil' },
    { key: 'Healthcare', label: 'Səhiyyə' },
    { key: 'Environment', label: 'Ətraf Mühit' },
    { key: 'Poverty Alleviation', label: 'Yoxsulluğun Azaldılması' },
    { key: 'Legal Aid', label: 'Hüquqi Yardım' },
    { key: 'Community Development', label: 'İcma İnkişafı' },
    { key: 'Youth Development', label: 'Gənclər İnkişafı' },
    { key: 'Elderly Care', label: 'Yaşlılara Dəstək' },
    { key: 'Disability Rights', label: 'Əlillik Hüquqları' },
    { key: 'LGBTQ+ Rights', label: 'LGBTQ+ Hüquqları' },
    { key: 'Mental Health', label: 'Mental Sağlamlıq' },
    { key: 'Other', label: 'Digər' }
  ];
  
  const [formData, setFormData] = useState({ name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Organization-specific fields
    organizationName: '',
    organizationType: '',
    description: '',
    website: '',
    contactPhone: '',
    address: '',
    registrationNumber: '',
    focusAreas: [] as string[],
    // Contact person fields
    contactPersonName: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    contactPersonPosition: '' })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Reset form when registration type changes
  useEffect(() => { setFormData({ name: '',
      email: '',
      password: '',
      confirmPassword: '',
      // Organization-specific fields
      organizationName: '',
      organizationType: '',
      description: '',
      website: '',
      contactPhone: '',
      address: '',
      registrationNumber: '',
      focusAreas: [],
      // Contact person fields
      contactPersonName: '',
      contactPersonEmail: '',
      contactPersonPhone: '',
      contactPersonPosition: '' })
    setErrors({}) }, [registrationType])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { const { name, value } = e.target
    setFormData(prev => ({ ...prev,
      [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) { setErrors(prev => ({ ...prev,
        [name]: '' })) } }

  const handleGoogleSignUp = async () => { try { await signInWithOAuth('google', `${window.location.origin}/auth/callback?next=${encodeURIComponent(localePath('/'))}`) } catch (error: any) { setErrors({ submit: error?.message || 'Google ilə qeydiyyat zamanı xəta baş verdi' }) } }

  const handleFocusAreaChange = (area: string) => { setFormData(prev => ({ ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area] })) }

  const validateForm = () => { const newErrors: {[key: string]: string} = {}

    // Name validation only for regular users
    if (registrationType === 'user' && !formData.name.trim()) { newErrors.name = 'Ad tələb olunur' }

    if (!formData.email.trim()) { newErrors.email = 'E-poçt tələb olunur' } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { newErrors.email = 'Etibarlı e-poçt ünvanı daxil et' }

    if (!formData.password) { newErrors.password = 'Şifrə tələb olunur' } else if (formData.password.length < 6) { newErrors.password = 'Şifrə ən azı 6 simvoldan ibarət olmalıdır' }

    if (!formData.confirmPassword) { newErrors.confirmPassword = 'Şifrəni təsdiqlə' } else if (formData.password !== formData.confirmPassword) { newErrors.confirmPassword = 'Şifrələr uyğun gəlmir' }

    // Organization-specific validation
    if (registrationType === 'organization') { if (!formData.organizationName.trim()) { newErrors.organizationName = 'Təşkilat adı tələb olunur' }
      if (!formData.organizationType) { newErrors.organizationType = 'Təşkilat növü tələb olunur' }
      if (!formData.description.trim()) { newErrors.description = 'Təşkilat təsviri tələb olunur' }
      if (formData.focusAreas.length === 0) { newErrors.focusAreas = 'Ən azı bir fəaliyyət sahəsi seç' }
      if (formData.website && !/^https?:\/\/.+/.test(formData.website)) { newErrors.website = 'Etibarlı veb sayt URL daxil et' }
      // Contact person validation
      if (!formData.contactPersonName.trim()) { newErrors.contactPersonName = 'Əlaqə şəxsinin adı tələb olunur' }
      if (!formData.contactPersonEmail.trim()) { newErrors.contactPersonEmail = 'Əlaqə şəxsinin e-poçtu tələb olunur' } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactPersonEmail)) { newErrors.contactPersonEmail = 'Etibarlı əlaqə şəxsinin e-poçtu daxil et' } }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0 }

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault()
    console.log('Form submitted with data:', formData)
    
    if (!validateForm()) { console.log('Form validation failed')
      return }

    setLoading(true)
    setErrors({})

    try { console.log('Sending registration request...')
      const requestBody: any = { email: formData.email,
          password: formData.password,
          type: registrationType }

        // Add name only for regular users
        if (registrationType === 'user') { requestBody.name = formData.name }

        // Add organization profile for organization registrations
        if (registrationType === 'organization') { requestBody.organizationProfile = { organizationName: formData.organizationName,
            organizationType: formData.organizationType,
            description: formData.description,
            website: formData.website || undefined,
            contactPhone: formData.contactPhone || undefined,
            address: formData.address || undefined,
            registrationNumber: formData.registrationNumber || undefined,
            focusAreas: formData.focusAreas,
            contactPerson: { name: formData.contactPersonName,
              email: formData.contactPersonEmail,
              phone: formData.contactPersonPhone || undefined,
              position: formData.contactPersonPosition || undefined } } }

        const response = await fetch('/api/auth/register', { method: 'POST',
          headers: { 'Content-Type': 'application/json', },
          body: JSON.stringify(requestBody), })

      const data = await response.json()
      console.log('Registration response:', data)

      if (response.ok) { setSuccess(true)
        console.log('Registration successful!') } else { setErrors({ submit: data.error || 'Qeydiyyat alınmadı' })
        console.log('Registration failed:', data.error) } } catch (error) { console.error('Registration error:', error)
      setErrors({ submit: 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.' }) } finally { setLoading(false) } }

  if (success) { return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full animate-scale-in">
          <div className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 shadow-sm">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">{'Qeydiyyat Uğurlu!'}</h3>
            <p className="text-gray-600 mb-8 text-sm sm:text-base leading-relaxed">
              {'Ünvanına təsdiq e-poçtu göndərdik. E-poçtunu yoxla və hesabı aktivləşdirmək üçün təsdiq linkini klikə.'}
            </p>
            <Link href={localePath("/auth/signin")}>
              <Button 
                variant="primary" 
                size="lg"
                fullWidth
                className="group"
              >
                <span>{'Daxil Olma Səhifəsinə Keç'}</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    ) }

  return (
  <div className="min-h-screen bg-background text-foreground lg:bg-white flex">
    {/* Left Side - Form */}
    <div className="flex-1 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
      <div className="w-full max-w-2xl mx-auto lg:mx-0">
        {/* Logo and Header */}
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <Logo 
            href={localePath("/")}
            size="md"
            variant="dark"
             showText={false}
            showTagline={false}
            className="mb-6"
          />
          
          
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2">
            {registrationType === 'organization' ? 'Təşkilatı Qeydiyyatdan Keçir' : 'Hesab yarat'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {registrationType === 'organization' 
              ? 'Təşkilat şəbəkəmizə qoşul və ictimai təsir yarat'
              : 'icma360 ilə əlaqə qur, öyrən və inkişaf et' }
          </p>
        </div>

        {/* Registration Type Tabs */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-1 shadow-sm animate-fade-in animation-delay-200">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setRegistrationType('user')}
              className={`flex items-center justify-center px-4 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${ registrationType === 'user'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50' }`}
            >
              <User className="w-4 h-4 mr-2" />
              {'Fərdi İstifadəçi'}
            </button>
            <button
              type="button"
              onClick={() => setRegistrationType('organization')}
              className={`flex items-center justify-center px-4 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${ registrationType === 'organization'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50' }`}
            >
              <Building className="w-4 h-4 mr-2" />
              {'Təşkilat Hesabı'}
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 animate-fade-in animation-delay-400">
          {errors.submit && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {errors.submit}
                  </h3>
                </div>
              </div>
            </div>
          )}
          
          {/* Google Sign Up - Only show for individual users */}
          {registrationType === 'user' && (
            <>
              <div className="mb-6">
                <Button
                  onClick={handleGoogleSignUp}
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
                  {'Google ilə davam et'}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    {'Və ya e-poçt ilə qeydiyyatdan keç'}
                  </span>
                </div>
              </div>
            </>
          )}

          <form className={`space-y-5 ${registrationType === 'user' ? 'mt-6' : ''}`} onSubmit={handleSubmit} autoComplete="off">
            {/* User Registration Fields */}
            {registrationType === 'user' && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">{'Tam Ad'}</label>
                  <div className="mt-1">
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder={'Tam adını daxil et'}
                      value={formData.name}
                      onChange={handleChange}
                      autoComplete="name"
                      icon={User}
                      inputSize="md"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

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
                    <button type="button" tabIndex={-1} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">{'Şifrəni Təsdiq Et'}</label>
                  <div className="mt-1 relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder={'Şifrəni Təsdiq Et'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      icon={Lock}
                    inputSize="md"/>
                    <button type="button" tabIndex={-1} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600" onClick={() => setShowConfirmPassword(v => !v)}>
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </>
            )}

            {/* Organization Registration Fields */}
            {registrationType === 'organization' && (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{'Təşkilat Məlumatları'}</h3>
                </div>
                
                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">{'Təşkilatın Adı'} {'*'}</label>
                  <div className="mt-1 relative">
                    <Input
                      id="organizationName"
                      name="organizationName"
                      type="text"
                      required
                      placeholder={'Təşkilatın adını daxil et'}
                      value={formData.organizationName}
                      onChange={handleChange}
                      icon={Building}
                    inputSize="md"/>
                  </div>
                  {errors.organizationName && <p className="mt-1 text-sm text-red-600">{errors.organizationName}</p>}
                </div>

                <div>
                  <label htmlFor="organizationType" className="block text-sm font-medium text-gray-700">{'Təşkilat növü'} {'*'}</label>
                  <div className="mt-1 relative">
                    <select
                      id="organizationType"
                      name="organizationType"
                      required
                      value={formData.organizationType}
                      onChange={handleChange}
                      className="block w-full rounded-md border border-gray-300 bg-white py-2.5 pl-3 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="">{'Təşkilat növünü seçin'}</option>
                      {ORGANIZATION_TYPE_VALUES.map((value) => (
                        <option key={value} value={value}>
                          {ORGANIZATION_TYPE_LABELS[value]}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.organizationType && <p className="mt-1 text-sm text-red-600">{errors.organizationType}</p>}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">{'E-poçt ünvanı'}</label>
                  <div className="mt-1 relative">
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
                    inputSize="md"/>
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
                    inputSize="md"/>
                    <button type="button" tabIndex={-1} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">{'Şifrəni Təsdiq Et'}</label>
                  <div className="mt-1 relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder={'Şifrəni Təsdiq Et'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      icon={Lock}
                    inputSize="md"/>
                    <button type="button" tabIndex={-1} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600" onClick={() => setShowConfirmPassword(v => !v)}>
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </>
            )}

            {/* Organization Details */}
            {registrationType === 'organization' && (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{'Təşkilat Təfərrüatları'}</h3>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">{'Təşkilat Təsviri'} {'*'}</label>
                  <div className="mt-1">
                    <TextArea
                      id="description"
                      name="description"
                      rows={4}
                      required
                      placeholder={'Təşkilatın missiyasını və fəaliyyətlərini təsvir et'}
                      value={formData.description}
                      onChange={handleChange}
                      textAreaSize="md"
                    />
                  </div>
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">{'Veb sayt'}</label>
                    <div className="mt-1 relative">
                      <Input
                        id="website"
                        name="website"
                        type="url"
                        placeholder={'https://təşkilatın.org'}
                        value={formData.website}
                        onChange={handleChange}
                        icon={Globe}
                      inputSize="md"/>
                    </div>
                    {errors.website && <p className="mt-1 text-sm text-red-600">{errors.website}</p>}
                  </div>

                  <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">{'Təşkilat Telefonu'}</label>
                    <div className="mt-1 relative">
                      <Input
                        id="contactPhone"
                        name="contactPhone"
                        type="tel"
                        placeholder={'+994 (XX) XXX-XX-XX'}
                        value={formData.contactPhone}
                        onChange={handleChange}
                        icon={Phone}
                      inputSize="md"/>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">{'Ünvan'}</label>
                  <div className="mt-1 relative">
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      placeholder={'Təşkilat ünvanı'}
                      value={formData.address}
                      onChange={handleChange}
                      icon={MapPin}
                    inputSize="md"/>
                  </div>
                </div>

                <div>
                  <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700">{'Qeydiyyat Nömrəsi'}</label>
                  <div className="mt-1 relative">
                    <Input
                      id="registrationNumber"
                      name="registrationNumber"
                      type="text"
                      placeholder={'Rəsmi qeydiyyat nömrəsi'}
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      icon={FileText}
                    inputSize="md"/>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">{'Fəaliyyət Sahələri'} {'*'}</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {focusAreasOptions.map((area) => (
                      <label key={area.key} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.focusAreas.includes(area.key)}
                          onChange={() => handleFocusAreaChange(area.key)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{area.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.focusAreas && <p className="mt-1 text-sm text-red-600">{errors.focusAreas}</p>}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{'Əlaqə Şəxsinin Məlumatları'}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactPersonName" className="block text-sm font-medium text-gray-700">{'Əlaqə Şəxsinin Adı'} {'*'}</label>
                    <div className="mt-1 relative">
                      <Input
                        id="contactPersonName"
                        name="contactPersonName"
                        type="text"
                        required
                        placeholder={'Əlaqə şəxsinin tam adı'}
                        value={formData.contactPersonName}
                        onChange={handleChange}
                        icon={User}
                      inputSize="md"/>
                    </div>
                    {errors.contactPersonName && <p className="mt-1 text-sm text-red-600">{errors.contactPersonName}</p>}
                  </div>

                  <div>
                    <label htmlFor="contactPersonEmail" className="block text-sm font-medium text-gray-700">{'Əlaqə Şəxsinin E-poçtu'} {'*'}</label>
                    <div className="mt-1 relative">
                      <Input
                        id="contactPersonEmail"
                        name="contactPersonEmail"
                        type="email"
                        required
                        placeholder={'elaqe@təşkilat.org'}
                        value={formData.contactPersonEmail}
                        onChange={handleChange}
                        icon={Mail}
                      inputSize="md"/>
                    </div>
                    {errors.contactPersonEmail && <p className="mt-1 text-sm text-red-600">{errors.contactPersonEmail}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactPersonPhone" className="block text-sm font-medium text-gray-700">{'Əlaqə Şəxsinin Telefonu'}</label>
                    <div className="mt-1 relative">
                      <Input
                        id="contactPersonPhone"
                        name="contactPersonPhone"
                        type="tel"
                        placeholder={'+994 (XX) XXX-XX-XX'}
                        value={formData.contactPersonPhone}
                        onChange={handleChange}
                        icon={Phone}
                      inputSize="md"/>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contactPersonPosition" className="block text-sm font-medium text-gray-700">{'Vəzifə/Titul'}</label>
                    <div className="mt-1 relative">
                      <Input
                        id="contactPersonPosition"
                        name="contactPersonPosition"
                        type="text"
                        placeholder={'Direktor, Menecer, və s.'}
                        value={formData.contactPersonPosition}
                        onChange={handleChange}
                        icon={Users}
                      inputSize="md"/>
                    </div>
                  </div>
                </div>



                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">{'Təsdiq Tələb Olunur'}</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>{'Təşkilat qeydiyyatın admin komandamız tərəfindən yoxlanılacaq. Təsdiq edildikdən sonra e-poçt bildirişi alacaqsan.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            <div>
              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                fullWidth
                loading={loading}
              >
                {loading ? 'Hesab Yaradılır...' : 'Hesab Yarat'}
              </Button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {'Artıq hesabın var?'}{' '}
              <Link href={localePath("/auth/signin")} className="font-medium text-blue-600 hover:text-blue-500">
                {'Buradan daxil ol'}
              </Link>
            </p>
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
            {'İcmamıza qoşul'}
          </h2>
          
          <p className="mb-8 text-lg leading-relaxed text-gray-600">
            {'Pulsuz hesab yarat, imkanları izləməyə başla və icma ilə birlikdə inkişaf et.'}
          </p>

          {/* Benefits List */}
          <div className="space-y-4 mb-8">
            {[
              { icon: Shield, text: 'Pulsuz hesab və tam giriş' },
              { icon: Users, text: 'İcma ilə əlaqə qur' },
              { icon: Sparkles, text: 'Təsirini paylaş' },
              { icon: CheckCircle, text: 'Yoxlanmış resurslar' }
            ].map((benefit, idx) => (
              <div key={idx} className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-3 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="font-medium text-gray-700">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm text-gray-500">
              {'Etibar edənlər'}
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '10K+', label: 'Üzv' },
                { value: '500+', label: 'Təşkilat' },
                { value: '100%', label: 'Pulsuz' }
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="mb-1 text-2xl font-black text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  ) }

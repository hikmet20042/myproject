'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, User, Mail, Lock, Building, Globe, Phone, MapPin, FileText, Tag } from 'lucide-react'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const isNGORegistration = searchParams.get('type') === 'ngo'
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // NGO-specific fields
    organizationName: '',
    description: '',
    website: '',
    contactPhone: '',
    address: '',
    registrationNumber: '',
    focusAreas: [] as string[]
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleFocusAreaChange = (area: string) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }))
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // NGO-specific validation
    if (isNGORegistration) {
      if (!formData.organizationName.trim()) {
        newErrors.organizationName = 'Organization name is required'
      }
      if (!formData.description.trim()) {
        newErrors.description = 'Organization description is required'
      }
      if (formData.focusAreas.length === 0) {
        newErrors.focusAreas = 'Please select at least one focus area'
      }
      if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
        newErrors.website = 'Please enter a valid website URL'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with data:', formData)
    
    if (!validateForm()) {
      console.log('Form validation failed')
      return
    }

    setLoading(true)
    setErrors({})

    try {
      console.log('Sending registration request...')
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          type: isNGORegistration ? 'ngo' : 'user',
          ngoProfile: isNGORegistration ? {
            organizationName: formData.organizationName,
            description: formData.description,
            website: formData.website || undefined,
            contactPhone: formData.contactPhone || undefined,
            address: formData.address || undefined,
            registrationNumber: formData.registrationNumber || undefined,
            focusAreas: formData.focusAreas
          } : undefined
        }),
      })

      const data = await response.json()
      console.log('Registration response:', data)

      if (response.ok) {
        setSuccess(true)
        console.log('Registration successful!')
      } else {
        setErrors({ submit: data.error || 'Registration failed' })
        console.log('Registration failed:', data.error)
      }
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({ submit: 'An error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Registration Successful!</h3>
            <p className="text-gray-600 mb-6">
              We've sent a verification email to your address. Please check your email and click the verification link to activate your account.
            </p>
            <Link
              href="/auth/signin"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fadein">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">GE</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
              {isNGORegistration ? 'Register Your NGO' : 'Create your account'}
            </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isNGORegistration 
              ? 'Join our network of social justice organizations'
              : 'Access your Social Justice Platform dashboard'
            }
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
  <div className="bg-white py-8 px-4 shadow-xl border border-gray-200 sm:rounded-lg sm:px-10 transition-all duration-500 animate-fadein">
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
          <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-2.5 text-gray-400"><User size={18} /></span>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-2.5 text-gray-400"><Mail size={18} /></span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-2.5 text-gray-400"><Lock size={18} /></span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Password (min. 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button type="button" tabIndex={-1} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-2.5 text-gray-400"><Lock size={18} /></span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button type="button" tabIndex={-1} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600" onClick={() => setShowConfirmPassword(v => !v)}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            {/* NGO-specific fields */}
            {isNGORegistration && (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Information</h3>
                </div>
                
                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">Organization Name *</label>
                  <div className="mt-1 relative">
                    <span className="absolute left-3 top-2.5 text-gray-400"><Building size={18} /></span>
                    <input
                      id="organizationName"
                      name="organizationName"
                      type="text"
                      required
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter your organization name"
                      value={formData.organizationName}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.organizationName && <p className="mt-1 text-sm text-red-600">{errors.organizationName}</p>}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Organization Description *</label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Describe your organization's mission and activities"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website</label>
                    <div className="mt-1 relative">
                      <span className="absolute left-3 top-2.5 text-gray-400"><Globe size={18} /></span>
                      <input
                        id="website"
                        name="website"
                        type="url"
                        className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="https://yourorganization.org"
                        value={formData.website}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.website && <p className="mt-1 text-sm text-red-600">{errors.website}</p>}
                  </div>

                  <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">Contact Phone</label>
                    <div className="mt-1 relative">
                      <span className="absolute left-3 top-2.5 text-gray-400"><Phone size={18} /></span>
                      <input
                        id="contactPhone"
                        name="contactPhone"
                        type="tel"
                        className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="+1 (555) 123-4567"
                        value={formData.contactPhone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                  <div className="mt-1 relative">
                    <span className="absolute left-3 top-2.5 text-gray-400"><MapPin size={18} /></span>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Organization address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700">Registration Number</label>
                  <div className="mt-1 relative">
                    <span className="absolute left-3 top-2.5 text-gray-400"><FileText size={18} /></span>
                    <input
                      id="registrationNumber"
                      name="registrationNumber"
                      type="text"
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Official registration number"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Focus Areas *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      'Human Rights', 'Women Rights', 'Children Rights', 'Education',
                      'Healthcare', 'Environment', 'Poverty Alleviation', 'Legal Aid',
                      'Community Development', 'Youth Development', 'Elderly Care',
                      'Disability Rights', 'LGBTQ+ Rights', 'Mental Health', 'Other'
                    ].map((area) => (
                      <label key={area} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.focusAreas.includes(area)}
                          onChange={() => handleFocusAreaChange(area)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{area}</span>
                      </label>
                    ))}
                  </div>
                  {errors.focusAreas && <p className="mt-1 text-sm text-red-600">{errors.focusAreas}</p>}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Approval Required</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Your NGO registration will be reviewed by our admin team. You'll receive an email notification once approved.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in here
              </Link>
            </p>
          </div>
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-blue-500">
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

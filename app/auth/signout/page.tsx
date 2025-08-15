'use client'

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignOut() {
  const router = useRouter()

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut({ 
        callbackUrl: '/',
        redirect: false 
      })
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }

    handleSignOut()
  }, [router])

  return (
  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
  <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Signing out...
            </h2>
            
            <p className="mt-2 text-sm text-gray-600">
              You have been successfully signed out.
            </p>
            
            <div className="mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
            
            <p className="mt-4 text-xs text-gray-500">
              Redirecting to homepage...
            </p>
            
            <div className="mt-6">
              <Link 
                href="/"
                className="text-primary hover:text-primary-dark font-medium"
              >
                Go to homepage now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

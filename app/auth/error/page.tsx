'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

const errorMessages: { [key: string]: string } = {
  'Configuration': 'There is a problem with the server configuration.',
  'AccessDenied': 'Access denied. You do not have permission to sign in.',
  'Verification': 'The verification token has expired or has already been used.',
  'Default': 'An unexpected error occurred during authentication.',
  'Signin': 'Error during sign in process.',
  'OAuthSignin': 'Error in constructing an OAuth authorization URL.',
  'OAuthCallback': 'Error in handling the response from an OAuth provider.',
  'OAuthCreateAccount': 'Could not create OAuth account in the database.',
  'EmailCreateAccount': 'Could not create email account in the database.',
  'Callback': 'Error in the OAuth callback handler route.',
  'OAuthAccountNotLinked': 'To confirm your identity, sign in with the same account you used originally.',
  'EmailSignin': 'Sending the e-mail with the verification token failed.',
  'CredentialsSignin': 'The authorize callback returned null in the Credentials provider.',
  'SessionRequired': 'The content of this page requires you to be signed in at all times.',
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'Default'
  const errorMessage = errorMessages[error] || errorMessages['Default']

  return (
  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
  <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Authentication Error
            </h2>
            
            <p className="mt-2 text-sm text-gray-600">
              {errorMessage}
            </p>
            
            {error === 'OAuthAccountNotLinked' && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  It looks like you have an existing account with a different sign-in method. 
                  Please use the same method you used when you first created your account.
                </p>
              </div>
            )}
            
            <div className="mt-6 space-y-3">
              <Link 
                href="/auth/signin"
                className="block w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 text-center"
              >
                Try signing in again
              </Link>
              
              <Link 
                href="/"
                className="block text-gray-600 hover:text-primary text-sm"
              >
                ← Return to homepage
              </Link>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-3 bg-gray-100 rounded-md">
                <p className="text-xs text-gray-600">
                  <strong>Debug info:</strong> {error}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}

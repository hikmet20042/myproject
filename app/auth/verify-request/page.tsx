import Link from 'next/link'

export default function VerifyRequest() {
  return (
  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
  <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Check your email
            </h2>
            
            <p className="mt-2 text-sm text-gray-600">
              A sign-in link has been sent to your email address.
            </p>
            
            <div className="mt-6 space-y-4">
              <div className="text-sm text-gray-500">
                <p>• Click the link in your email to sign in</p>
                <p>• The link will expire in 24 hours</p>
                <p>• You can close this page</p>
              </div>
              
              <div className="pt-4">
                <Link 
                  href="/auth/signin"
                  className="text-primary hover:text-primary-dark font-medium text-sm"
                >
                  Try a different email
                </Link>
              </div>
              
              <div>
                <Link 
                  href="/"
                  className="text-gray-600 hover:text-primary text-sm"
                >
                  ← Return to homepage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

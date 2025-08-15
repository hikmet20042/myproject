import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Only protect admin and submit routes
  if (pathname.startsWith('/admin') || (pathname.startsWith('/submit') && !pathname.startsWith('/submit/story'))) {
      // Check if user is trying to access admin routes
      if (pathname.startsWith('/admin')) {
        // Check if user has admin role
        if (!token || token.role !== 'admin') {
          // Redirect to sign-in with callback URL
          const signInUrl = new URL('/auth/signin', req.url)
          signInUrl.searchParams.set('callbackUrl', pathname)
          return NextResponse.redirect(signInUrl)
        }
      }

      // Check if user is trying to access submit route
      if (pathname.startsWith('/submit') && !pathname.startsWith('/submit/story')) {
        // Require authentication for submit route except /submit/story
        if (!token) {
          const signInUrl = new URL('/auth/signin', req.url)
          signInUrl.searchParams.set('callbackUrl', pathname)
          return NextResponse.redirect(signInUrl)
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Only apply authorization logic to protected routes
        if (pathname.startsWith('/admin') || pathname.startsWith('/submit')) {
          // For admin routes, require admin role
          if (pathname.startsWith('/admin')) {
            return !!token && token.role === 'admin'
          }
          // For submit route, require any authenticated user, except /submit/story
          if (pathname.startsWith('/submit') && !pathname.startsWith('/submit/story')) {
            return !!token
          }
        }
        
        // Allow all other routes
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Only apply middleware to admin and submit routes
     * Exclude all API routes, static files, and auth routes
     */
    '/admin/:path*',
    '/submit/:path*'
  ],
}

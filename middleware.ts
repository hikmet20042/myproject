import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Ensure NextAuth always has an absolute callback URL
if (!process.env.NEXTAUTH_URL) {
  const fallbackUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  process.env.NEXTAUTH_URL = fallbackUrl
}

// Enable trust host for production serverless environments
if (process.env.NODE_ENV === 'production') {
  process.env.AUTH_TRUST_HOST = 'true'
}

// Language configuration
const defaultLanguage = 'az'
const languages = ['az', 'en']

// Routes that should not have language prefix (API, static files, auth, etc.)
const excludedPaths = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap',
  '/locales'
]

function shouldExcludePath(pathname: string): boolean {
  return excludedPaths.some(path => pathname.startsWith(path))
}

function getLanguageFromPath(pathname: string): { language: string | null; pathWithoutLanguage: string } {
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  
  if (languages.includes(firstSegment)) {
    return {
      language: firstSegment,
      pathWithoutLanguage: '/' + segments.slice(1).join('/')
    }
  }
  
  return {
    language: null,
    pathWithoutLanguage: pathname
  }
}

// Authorization check function
function checkAuthorization(pathWithoutLanguage: string, token: any, pathname: string, language: string, req: any) {
  // Normalize legacy NGO dashboard route to the unified dashboard
  if (pathWithoutLanguage.includes('/ngo-dashboard')) {
    const newPathname = pathname.replace('/ngo-dashboard', '/dashboard')
    return NextResponse.redirect(new URL(newPathname, req.url))
  }

  // Protect admin, submit, edit, dashboard, and profile routes
  if (pathWithoutLanguage.startsWith('/admin') || 
      pathWithoutLanguage.startsWith('/submit') ||
      pathWithoutLanguage.startsWith('/edit/blog') ||
      pathWithoutLanguage.startsWith('/dashboard') ||
      pathWithoutLanguage.startsWith('/profile')) {
    
    // Check if user is trying to access admin routes
    if (pathWithoutLanguage.startsWith('/admin')) {
      // Check if user has admin role
      if (!token || token.role !== 'admin') {
        // Redirect to sign-in with callback URL
        const signInUrl = new URL(`/${language}/auth/signin`, req.url)
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
      }
    }

    // Check if user is trying to access submit routes (including /submit/blog)
    if (pathWithoutLanguage.startsWith('/submit')) {
      // Require authentication for all submit routes
      if (!token) {
        const signInUrl = new URL(`/${language}/auth/signin`, req.url)
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
      }
    }

    // Check if user is trying to access edit routes
    if (pathWithoutLanguage.startsWith('/edit/blog')) {
      // Require authentication for edit routes
      if (!token) {
        const signInUrl = new URL(`/${language}/auth/signin`, req.url)
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
      }
    }

    // Check if user is trying to access dashboard
    if (pathWithoutLanguage.startsWith('/dashboard') && !pathWithoutLanguage.startsWith('/ngo-dashboard')) {
      // Require authentication for dashboard
      if (!token) {
        const signInUrl = new URL(`/${language}/auth/signin`, req.url)
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
      }
    }

    // Check if user is trying to access profile
    if (pathWithoutLanguage.startsWith('/profile')) {
      // Require authentication for profile
      if (!token) {
        const signInUrl = new URL(`/${language}/auth/signin`, req.url)
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
      }
    }
  }
  
  return null
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Skip language handling for excluded paths
    if (!shouldExcludePath(pathname)) {
      const { language, pathWithoutLanguage } = getLanguageFromPath(pathname)
      
      // If no language prefix, redirect to default language (Azerbaijani)
      if (!language) {
        const newUrl = new URL(`/${defaultLanguage}${pathname}`, req.url)
        newUrl.search = req.nextUrl.search
        return NextResponse.redirect(newUrl)
      }
      
      const authResponse = checkAuthorization(pathWithoutLanguage, token, pathname, language, req)
      if (authResponse) {
        return authResponse
      }
      
      // Rewrite the URL to remove language prefix for Next.js routing
      // This allows /az/blogs to map to /blogs internally
      const rewriteUrl = new URL(pathWithoutLanguage || '/', req.url)
      rewriteUrl.search = req.nextUrl.search
      
      // Store language in header for access in components
      const response = NextResponse.rewrite(rewriteUrl)
      response.headers.set('x-language', language)
      
      return response
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all paths except static files and API routes
     * This allows us to handle language prefixes and authentication
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap).*)',
  ],
}

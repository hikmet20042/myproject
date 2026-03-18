import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes that should not have language prefix (API, static files, auth, etc.)
const excludedPaths = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap',
  '/auth/callback'
]

function shouldExcludePath(pathname: string): boolean {
  return excludedPaths.some(path => pathname.startsWith(path))
}

function getPathWithoutLanguage(pathname: string): { hadLanguagePrefix: boolean; pathWithoutLanguage: string } {
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  
  if (firstSegment === 'az' || firstSegment === 'en') {
    return {
      hadLanguagePrefix: true,
      pathWithoutLanguage: '/' + segments.slice(1).join('/')
    }
  }
  
  return {
    hadLanguagePrefix: false,
    pathWithoutLanguage: pathname
  }
}

// Authorization check function
async function checkAuthorization(pathWithoutLanguage: string, pathname: string, req: NextRequest) {
  // Normalize legacy organization dashboard route to the unified dashboard
  if (pathWithoutLanguage.includes('/organization-dashboard')) {
    const newPathname = pathname.replace('/organization-dashboard', '/dashboard')
    return NextResponse.redirect(new URL(newPathname, req.url))
  }

  // Protect admin, submit, edit, dashboard, and profile routes
  if (pathWithoutLanguage.startsWith('/admin') || 
      pathWithoutLanguage.startsWith('/submit') ||
      pathWithoutLanguage.startsWith('/edit/blog') ||
      pathWithoutLanguage.startsWith('/dashboard') ||
      pathWithoutLanguage.startsWith('/profile')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.next()
    }

    const response = NextResponse.next()
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, any> = {}) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, any> = {}) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    })

    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user

    const requireAuth = (pathWithoutLanguage.startsWith('/submit') ||
      pathWithoutLanguage.startsWith('/edit/blog') ||
      pathWithoutLanguage.startsWith('/dashboard') ||
      pathWithoutLanguage.startsWith('/profile') ||
      pathWithoutLanguage.startsWith('/admin'))

    if (requireAuth && !user) {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }

    if (pathWithoutLanguage.startsWith('/admin')) {
      let isAdmin = false

      if (user) {
        const { data: account } = await supabase
          .from('accounts')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle()

        isAdmin = account?.is_admin === true

        // Backward compatibility while legacy metadata still exists.
        if (!isAdmin) {
          const legacyRole = (user.app_metadata?.role as string) || 'user'
          isAdmin = legacyRole === 'admin'
        }
      }

      if (!isAdmin) {
        const signInUrl = new URL('/auth/signin', req.url)
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
      }
    }
  }
  
  return null
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (shouldExcludePath(pathname)) {
    return NextResponse.next()
  }

  const { hadLanguagePrefix, pathWithoutLanguage } = getPathWithoutLanguage(pathname)

  // Redirect legacy prefixed routes (/az/*, /en/*) to canonical non-prefixed routes.
  if (hadLanguagePrefix) {
    const newUrl = new URL(pathWithoutLanguage || '/', req.url)
    newUrl.search = req.nextUrl.search
    return NextResponse.redirect(newUrl)
  }

  const authResponse = await checkAuthorization(pathWithoutLanguage, pathname, req)
  if (authResponse) {
    return authResponse
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and API routes.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap).*)',
  ],
}

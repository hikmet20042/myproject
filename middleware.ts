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

const APPROVED_ORGANIZATION_ONLY_PREFIXES = [
  '/dashboard',
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

  const shouldInspectAuth =
    pathWithoutLanguage.startsWith('/admin') ||
    pathWithoutLanguage.startsWith('/submit') ||
    pathWithoutLanguage.startsWith('/edit/blog') ||
    pathWithoutLanguage.startsWith('/dashboard') ||
    pathWithoutLanguage.startsWith('/profile') ||
    pathWithoutLanguage.startsWith('/organization') ||
    pathWithoutLanguage.startsWith('/onboarding') ||
    !pathWithoutLanguage.startsWith('/auth')

  if (shouldInspectAuth) {
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
      pathWithoutLanguage.startsWith('/saved') ||
      pathWithoutLanguage.startsWith('/notifications') ||
      pathWithoutLanguage.startsWith('/organization') ||
      pathWithoutLanguage.startsWith('/admin') ||
      pathWithoutLanguage.startsWith('/onboarding'))

    if (requireAuth && !user) {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }

    if (user) {
      const { data: account } = await supabase
        .from('accounts')
        .select('account_type')
        .eq('id', user.id)
        .maybeSingle()

      const accountType = account?.account_type ?? null
      const isOnboardingRoute = pathWithoutLanguage.startsWith('/onboarding')

      if (!accountType && !isOnboardingRoute) {
        return NextResponse.redirect(new URL('/onboarding/role', req.url))
      }

      if (accountType === 'user' && isOnboardingRoute) {
        return NextResponse.redirect(new URL('/', req.url))
      }

      if (accountType === 'organization') {
        const { data: organizationProfile } = await supabase
          .from('organization_profiles')
          .select('moderation_status')
          .eq('account_id', user.id)
          .maybeSingle()

        if (!organizationProfile && pathWithoutLanguage !== '/onboarding/organization') {
          return NextResponse.redirect(new URL('/onboarding/organization', req.url))
        }

        if (isOnboardingRoute && organizationProfile) {
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }

      const shouldCheckOrganizationState =
        APPROVED_ORGANIZATION_ONLY_PREFIXES.some(prefix => pathWithoutLanguage.startsWith(prefix)) ||
        pathWithoutLanguage.startsWith('/organization')

      if (shouldCheckOrganizationState) {
        if (accountType === 'organization') {
          const { data: organizationProfile } = await supabase
            .from('organization_profiles')
            .select('moderation_status')
            .eq('account_id', user.id)
            .maybeSingle()

          const organizationStatus = organizationProfile?.moderation_status
          const isPendingOrganization = organizationStatus === 'pending'
          const isApprovedOnlyRoute = APPROVED_ORGANIZATION_ONLY_PREFIXES.some(prefix =>
            pathWithoutLanguage.startsWith(prefix)
          )

          // Pending organizations can access organization pending/profile pages,
          // but must not access approved-only routes such as dashboard.
          if (isPendingOrganization && isApprovedOnlyRoute) {
            return NextResponse.redirect(new URL('/organization/pending', req.url))
          }
        }
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

import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const RESERVED_HANDLES = [
  'admin', 'about', 'api', 'auth', 'blogs', 'dashboard', 'edit',
  'notifications', 'onboarding', 'organization', 'organizations',
  'profile', 'resources', 'saved', 'submit', 'users', 'u', 'o',
  'settings', 'login', 'logout', 'register', 'signup', 'signin',
  'search', 'help', 'contact', 'terms', 'privacy', 'feed', 'rss',
  'sitemap', 'robots.txt', 'favicon.ico', '_next', 'static',
  'events', 'vacancies', 'materials', 'home', 'page', 'pages',
  'app', 'apps', 'new', 'create', 'public', 'private', 'test',
  'demo', 'example', 'welcome', 'pricing', 'plans', 'docs',
  'documentation', 'blog', 'status', 'health', 'ping', 'upload',
  'download', 'files', 'images', 'media', 'assets', 'cdn', 'fonts', 'icons',
]

function validateHandle(handle: string): string | null {
  const normalized = handle.toLowerCase().trim()

  if (normalized.length < 3) return 'Handle must be at least 3 characters'
  if (normalized.length > 50) return 'Handle must be at most 50 characters'
  if (normalized.length > 1 && !/^[a-z0-9][a-z0-9_-]*[a-z0-9]$/.test(normalized)) {
    return 'Handle can only contain lowercase letters, numbers, hyphens and underscores, and must start and end with a letter or number'
  }
  if (normalized.length === 1 && !/^[a-z0-9]$/.test(normalized)) {
    return 'Handle can only contain lowercase letters and numbers'
  }
  if (RESERVED_HANDLES.includes(normalized)) return 'This handle is reserved'
  return null
}

export async function GET(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'publicRead',
      endpoint: '/api/handles/check',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const { searchParams } = new URL(request.url)
    const handle = searchParams.get('handle')

    if (!handle) {
      const response = errorResponse('Handle parameter is required', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const validationError = validateHandle(handle)
    if (validationError) {
      const response = successResponse({ available: false, reason: validationError })
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const supabase = createSupabaseAdminClient()

    const { data: accountMatch } = await supabase
      .from('accounts')
      .select('id')
      .eq('url_handle', handle.toLowerCase().trim())
      .maybeSingle()

    if (accountMatch) {
      const response = successResponse({ available: false, reason: 'Handle is already taken' })
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const { data: orgMatch } = await supabase
      .from('organization_profiles')
      .select('account_id')
      .eq('url_handle', handle.toLowerCase().trim())
      .maybeSingle()

    if (orgMatch) {
      const response = successResponse({ available: false, reason: 'Handle is already taken' })
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const response = successResponse({ available: true })
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response
  } catch (error) {
    console.error('Handle check error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}

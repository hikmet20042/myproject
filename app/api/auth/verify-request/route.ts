import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
    request,
    preset: 'auth',
    endpoint: '/api/auth/verify-request',
  })

  if (!rateLimitResult.allowed) {
    const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMITED', {}, 429)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }

  try {
    const supabase = createSupabaseServerClient()
    const body = await request.json().catch(() => ({}))
    const requestedEmail = String(body?.email || '').trim().toLowerCase()
    const { data: authData } = await supabase.auth.getUser()
    const targetEmail = authData?.user?.email || requestedEmail

    if (!targetEmail) {
      const response = errorResponse('Email is required', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(targetEmail)) {
      const response = errorResponse('Invalid email format', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (authData?.user?.email_confirmed_at) {
      const response = successResponse({
        message: 'Email is already verified.',
      })
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: targetEmail,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent('/auth/verify-email?verified=1')}`,
      },
    })

    // Keep response generic to avoid email/provider enumeration for unauthenticated callers.
    if (error && authData?.user?.email) {
      const response = errorResponse(error.message || 'Failed to send verification email', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const response = successResponse({
      message: 'Verification email sent.',
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('Verify request error:', error)
    const response = errorResponse('Internal server error', 'API_ERROR', {}, 500)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }
}

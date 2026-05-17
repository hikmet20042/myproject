import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

const GENERIC_SUCCESS_MESSAGE = 'If an account with that email exists, a password reset link has been sent.'

export async function POST(request: NextRequest) {
  const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
    request,
    preset: 'auth',
    endpoint: '/api/auth/forgot-password',
  })

  if (!rateLimitResult.allowed) {
    const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMITED', {}, 429)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }

  try {
    const { email } = await request.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()

    if (!normalizedEmail) {
      const response = errorResponse('Email is required', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      const response = errorResponse('Invalid email format', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const supabase = createSupabaseServerClient()

    // Keep response generic to avoid user enumeration.
    await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${appUrl}/auth/reset-password`,
    })

    const response = successResponse({
      message: GENERIC_SUCCESS_MESSAGE,
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('Forgot password error:', error)
    const response = errorResponse('Internal server error', 'API_ERROR', {}, 500)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }
}

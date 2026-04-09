import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { checkRateLimit, getRequestIp } from '@/lib/security/rateLimit'

const GENERIC_SUCCESS_MESSAGE = 'If an account with that email exists, a password reset link has been sent.'
const FORGOT_PASSWORD_LIMIT = 5
const FORGOT_PASSWORD_WINDOW_MS = 15 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request.headers)
    const rateLimit = checkRateLimit(`auth:forgot-password:${ip}`, FORGOT_PASSWORD_LIMIT, FORGOT_PASSWORD_WINDOW_MS)
    if (!rateLimit.allowed) {
      return errorResponse('Too many requests. Please try again later.', 'RATE_LIMITED', {}, 429)
    }

    const { email } = await request.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()

    if (!normalizedEmail) {
      return errorResponse('Email is required', 'API_ERROR', {}, 400)
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return errorResponse('Invalid email format', 'API_ERROR', {}, 400)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const supabase = createSupabaseServerClient()

    // Keep response generic to avoid user enumeration.
    await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${appUrl}/auth/reset-password`,
    })

    return successResponse({
      message: GENERIC_SUCCESS_MESSAGE,
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}

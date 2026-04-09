import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { checkRateLimit, getRequestIp } from '@/lib/security/rateLimit'

const VERIFY_RESEND_LIMIT = 5
const VERIFY_RESEND_WINDOW_MS = 15 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request.headers)
    const rateLimit = checkRateLimit(`auth:verify-request:${ip}`, VERIFY_RESEND_LIMIT, VERIFY_RESEND_WINDOW_MS)
    if (!rateLimit.allowed) {
      return errorResponse('Too many requests. Please try again later.', 'RATE_LIMITED', {}, 429)
    }

    const supabase = createSupabaseServerClient()
    const body = await request.json().catch(() => ({}))
    const requestedEmail = String(body?.email || '').trim().toLowerCase()
    const { data: authData } = await supabase.auth.getUser()
    const targetEmail = authData?.user?.email || requestedEmail

    if (!targetEmail) {
      return errorResponse('Email is required', 'API_ERROR', {}, 400)
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(targetEmail)) {
      return errorResponse('Invalid email format', 'API_ERROR', {}, 400)
    }

    if (authData?.user?.email_confirmed_at) {
      return successResponse({
        message: 'Email is already verified.',
      })
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
      return errorResponse(error.message || 'Failed to send verification email', 'API_ERROR', {}, 400)
    }

    return successResponse({
      message: 'Verification email sent.',
    })
  } catch (error) {
    console.error('Verify request error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}

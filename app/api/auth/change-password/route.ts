import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { checkRateLimit, getRequestIp } from '@/lib/security/rateLimit'

const CHANGE_PASSWORD_LIMIT = 10
const CHANGE_PASSWORD_WINDOW_MS = 15 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request.headers)
    const ipRateLimit = checkRateLimit(`auth:change-password:ip:${ip}`, CHANGE_PASSWORD_LIMIT, CHANGE_PASSWORD_WINDOW_MS)
    if (!ipRateLimit.allowed) {
      return errorResponse('Too many requests. Please try again later.', "RATE_LIMITED", {}, 429)
    }

    const supabase = createSupabaseServerClient()
    const { data: authData } = await supabase.auth.getUser()

    if (!authData?.user?.id || !authData.user.email) {
      return errorResponse('Authentication required', "API_ERROR", {}, 401)
    }

    const userRateLimit = checkRateLimit(
      `auth:change-password:user:${authData.user.id}`,
      CHANGE_PASSWORD_LIMIT,
      CHANGE_PASSWORD_WINDOW_MS,
    )
    if (!userRateLimit.allowed) {
      return errorResponse('Too many requests. Please try again later.', "RATE_LIMITED", {}, 429)
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return errorResponse('Current password and new password are required', "API_ERROR", {}, 400)
    }

    if (newPassword.length < 6) {
      return errorResponse('New password must be at least 6 characters long', "API_ERROR", {}, 400)
    }

    if (newPassword === currentPassword) {
      return errorResponse('New password must be different from current password', "API_ERROR", {}, 400)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return errorResponse('Supabase configuration missing', "API_ERROR", {}, 500)
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { error: signInError } = await anonClient.auth.signInWithPassword({
      email: authData.user.email,
      password: currentPassword
    })

    if (signInError) {
      return errorResponse('Current password is incorrect', "API_ERROR", {}, 400)
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      return errorResponse(updateError.message, "API_ERROR", {}, 500)
    }

    return successResponse({ message: 'Password changed successfully' }, {}, 200)

  } catch (error) {
    console.error('Error changing password:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}

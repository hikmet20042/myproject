import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { applyRateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  let createdAuthUserId: string | null = null

  const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
    request,
    preset: 'auth',
    endpoint: '/api/auth/register',
  })

  if (!rateLimitResult.allowed) {
    const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }

  try {
    const adminSupabase = createSupabaseAdminClient()
    const supabase = createSupabaseServerClient()
    const { email, password } = await request.json()
    const normalizedEmail = String(email || '').toLowerCase().trim()

    if (!normalizedEmail || !password) {
      const response = errorResponse('E-poçt və şifrə tələb olunur', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (password.length < 6) {
      const response = errorResponse('Şifrə ən azı 6 simvol olmalıdır', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      const response = errorResponse('Etibarlı e-poçt ünvanı daxil et', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const emailRedirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent('/auth/verify-email?verified=1')}`

    const rollbackCreatedAuthUser = async () => {
      if (!createdAuthUserId) return
      const { error: rollbackError } = await adminSupabase.auth.admin.deleteUser(createdAuthUserId)
      if (rollbackError) {
        console.error('Registration rollback failed:', rollbackError)
      }
      createdAuthUserId = null
    }

    const { data: signUpData, error: createError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo,
      },
    })

    if (createError) {
      if (/already\s*registered/i.test(createError.message || '')) {
        const response = errorResponse('Bu e-poçt ilə hesab artıq mövcuddur', 'API_ERROR', {}, 400)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }
      const response = errorResponse(createError.message || 'Qeydiyyat alınmadı', 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (!signUpData.user) {
      const response = errorResponse('Qeydiyyat alınmadı', 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    createdAuthUserId = signUpData.user.id

    const { error: accountError } = await adminSupabase
      .from('accounts')
      .upsert(
        {
          id: signUpData.user.id,
          account_type: null,
          is_admin: false,
          is_active: true,
        },
        { onConflict: 'id' },
      )

    if (accountError) {
      await rollbackCreatedAuthUser()
      const response = errorResponse(accountError.message, 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    createdAuthUserId = null

    // Send welcome notification to the new user
    try {
      await NotificationService.sendWelcomeNotification(signUpData.user.id, 'user')
    } catch (welcomeError) {
      console.error('Failed to send welcome notification:', welcomeError)
      // Don't fail registration if welcome notification fails
    }

    const response = successResponse({
      message: 'Qeydiyyat uğurludur',
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    if (createdAuthUserId) {
      try {
        const adminSupabase = createSupabaseAdminClient()
        await adminSupabase.auth.admin.deleteUser(createdAuthUserId)
        createdAuthUserId = null
      } catch (rollbackError) {
        console.error('Registration rollback in catch failed:', rollbackError)
      }
    }
    console.error('Registration error:', error)
    const response = errorResponse('Daxili server xətası', 'API_ERROR', {}, 500)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }
}

export async function GET() {
  return successResponse({ message: 'Registration endpoint' })
}

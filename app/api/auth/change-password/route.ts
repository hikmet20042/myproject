import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'
import { NotificationService } from '@/features/notifications/services/notificationService'

export async function POST(request: NextRequest) {
  const { result: rateLimitResult, headers: rateLimitHeaders } = await applyRateLimit({
    request,
    preset: 'auth',
    endpoint: '/api/auth/change-password',
  })

  if (!rateLimitResult.allowed) {
    const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', "RATE_LIMIT_EXCEEDED", {}, 429)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }

  try {
    const supabase = createSupabaseServerClient()
    const { data: authData } = await supabase.auth.getUser()

    if (!authData?.user?.id || !authData.user.email) {
      const response = errorResponse('Autentifikasiya tələb olunur', "API_ERROR", {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      const response = errorResponse('Cari şifrə və yeni şifrə tələb olunur', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (newPassword.length < 6) {
      const response = errorResponse('Yeni şifrə ən azı 6 simvol olmalıdır', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (newPassword === currentPassword) {
      const response = errorResponse('Yeni şifrə cari şifrədən fərqli olmalıdır', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      const response = errorResponse('Supabase konfiqurasiyası tapılmadı', "API_ERROR", {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { error: signInError } = await anonClient.auth.signInWithPassword({
      email: authData.user.email,
      password: currentPassword
    })

    if (signInError) {
      const response = errorResponse('Cari şifrə yanlışdır', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      const response = errorResponse(updateError.message, "API_ERROR", {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    // Send password changed notification
    try {
      await NotificationService.notifyPasswordChanged(authData.user.id)
    } catch (notificationError) {
      console.error('Failed to send password change notification:', notificationError)
    }

    const response = successResponse({ message: 'Şifrə uğurla dəyişdirildi' }, {}, 200)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response

  } catch (error) {
    console.error('Error changing password:', error)
    const response = errorResponse('Daxili server xətası', "API_ERROR", {}, 500)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }
}

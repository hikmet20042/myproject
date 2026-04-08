import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export async function POST(request: NextRequest) {
  let createdAuthUserId: string | null = null

  try {
    const adminSupabase = createSupabaseAdminClient()
    const supabase = createSupabaseServerClient()
    const { email, password } = await request.json()
    const normalizedEmail = String(email || '').toLowerCase().trim()

    if (!normalizedEmail || !password) {
      return errorResponse('E-poçt və şifrə tələb olunur', 'API_ERROR', {}, 400)
    }

    if (password.length < 6) {
      return errorResponse('Şifrə ən azı 6 simvol olmalıdır', 'API_ERROR', {}, 400)
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return errorResponse('Etibarlı e-poçt ünvanı daxil et', 'API_ERROR', {}, 400)
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
        return errorResponse('Bu e-poçt ilə hesab artıq mövcuddur', 'API_ERROR', {}, 400)
      }
      return errorResponse(createError.message || 'Qeydiyyat alınmadı', 'API_ERROR', {}, 500)
    }

    if (!signUpData.user) {
      return errorResponse('Qeydiyyat alınmadı', 'API_ERROR', {}, 500)
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
      return errorResponse(accountError.message, 'API_ERROR', {}, 500)
    }

    createdAuthUserId = null
    return successResponse({
      message: 'Qeydiyyat uğurludur',
    })
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
    return errorResponse('Daxili server xətası', 'API_ERROR', {}, 500)
  }
}

export async function GET() {
  return successResponse({ message: 'Registration endpoint' })
}

import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'

const ALLOWED_INTERESTS = ['IT', 'Təhsil', 'Könüllülük', 'Sosial fəaliyyət', 'Digər']

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 'API_ERROR', {}, 401)
    }

    const body = await request.json()
    const interestsRaw = Array.isArray(body?.interests) ? body.interests : []
    const interests = Array.from(new Set(interestsRaw.map((v: unknown) => String(v).trim()))).filter((v) =>
      ALLOWED_INTERESTS.includes(v),
    )

    if (interests.length < 1) {
      return errorResponse('Ən azı 1 maraq sahəsi seçin.', 'API_ERROR', {}, 400)
    }
    if (interests.length > 5) {
      return errorResponse('Maksimum 5 maraq sahəsi seçilə bilər.', 'API_ERROR', {}, 400)
    }

    const supabase = createSupabaseAdminClient()
    const userName = session.user.name || session.user.email?.split('@')[0] || 'İstifadəçi'

    const { error: userUpsertError } = await supabase
      .from('users')
      .upsert(
        {
          id: session.user.id,
          email: session.user.email,
          name: userName,
          role: 'user',
        },
        { onConflict: 'id' },
      )
    if (userUpsertError) {
      return errorResponse(userUpsertError.message, 'API_ERROR', {}, 500)
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: session.user.id,
          interests,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
    if (profileError) {
      return errorResponse(profileError.message, 'API_ERROR', {}, 500)
    }

    const { error: accountError } = await supabase
      .from('accounts')
      .update({
        account_type: 'user',
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)
    if (accountError) {
      return errorResponse(accountError.message, 'API_ERROR', {}, 500)
    }

    return successResponse({ message: 'User onboarding completed' })
  } catch (error) {
    console.error('User onboarding error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}

import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getUserAvatarPath, resolveProfileImageUrl } from '@/lib/profileImageUrls'
import { applyRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'publicRead',
      endpoint: '/api/users/public/[handle]',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMITED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabase = createSupabaseAdminClient()
    const handle = decodeURIComponent(params.handle).toLowerCase().trim()

    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, url_handle, created_at')
      .eq('url_handle', handle)
      .eq('account_type', 'user')
      .maybeSingle()

    if (accountError || !account) {
      const response = errorResponse('İstifadəçi tapılmadı', 'USER_NOT_FOUND', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('id', account.id)
      .single()

    if (!user) {
      const response = errorResponse('İstifadəçi tapılmadı', 'USER_NOT_FOUND', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', account.id)
      .single()

    const avatarPath = getUserAvatarPath((profile as any)?.avatar_metadata)
    const avatarUrl = await resolveProfileImageUrl(supabase, avatarPath, profile?.avatar || null)

    const { count: blogCount } = await supabase
      .from('blogs')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', account.id)
      .eq('status', 'approved')

    const response = successResponse({
      user: {
        id: user.id,
        name: user.name,
        avatar: null,
        avatarUrl,
        bio: profile?.bio || null,
        location: profile?.location || null,
        website: profile?.website || null,
        phone: profile?.phone || null,
        occupation: profile?.occupation || null,
        interests: profile?.interests || null,
        socialLinks: profile?.social_links || null,
        createdAt: account.created_at || user.created_at,
        urlHandle: account.url_handle,
        blogCount: blogCount || 0,
      },
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('Public user profile error:', error)
    const response = errorResponse('Daxili server xətası', 'INTERNAL_SERVER_ERROR', {}, 500)
    return response
  }
}

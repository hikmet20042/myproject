import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const handle = decodeURIComponent(params.handle).toLowerCase().trim()

    // Look up account by url_handle
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, url_handle, created_at')
      .eq('url_handle', handle)
      .eq('account_type', 'user')
      .maybeSingle()

    if (accountError || !account) {
      return errorResponse('User not found', 'USER_NOT_FOUND', {}, 404)
    }

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('id', account.id)
      .single()

    if (!user) {
      return errorResponse('User not found', 'USER_NOT_FOUND', {}, 404)
    }

    // Get profile details
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', account.id)
      .single()

    // Count blogs
    const { count: blogCount } = await supabase
      .from('blogs')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', account.id)
      .eq('status', 'approved')

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        avatar: profile?.avatar || profile?.avatar_blob_id ? null : null,
        avatarUrl: profile?.avatar || (profile?.avatar_blob_id ? `/api/images/${profile.avatar_blob_id}` : null),
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
  } catch (error) {
    console.error('Public user profile error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}

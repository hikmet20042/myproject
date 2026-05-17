import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isAdmin, isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getUserAvatarPath, resolveProfileImageUrl } from '@/lib/profileImageUrls'
import { applyRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

async function ensureUserRow(
  supabase: any,
  session: Awaited<ReturnType<typeof getServerSession>>
) {
  if (!session?.user?.id) return null

  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email, name, role, created_at')
    .eq('id', session.user.id)
    .maybeSingle()

  if (existingUser) {
    if (session.user.email && existingUser.email !== session.user.email) {
      const { data: syncedUser } = await supabase
        .from('users')
        .update({ email: session.user.email, updated_at: new Date().toISOString() })
        .eq('id', session.user.id)
        .select('id, email, name, role, created_at')
        .single()

      if (syncedUser) return syncedUser
    }

    return existingUser
  }

  const { data: createdUser, error: createError } = await supabase
    .from('users')
    .upsert(
      {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || session.user.email || 'User',
        role: session.user.role || 'user',
      },
      { onConflict: 'id' }
    )
    .select('id, email, name, role, created_at')
    .single()

  if (createError) {
    console.error('Profile GET - Failed to auto-create user row:', createError)
    return null
  }

  return createdUser
}

export async function GET(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'authenticatedRead',
      endpoint: '/api/users/profile',
    })

    const supabase = createSupabaseAdminClient()
  
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      console.log('Profile GET - No session or user ID');
      const response = errorResponse('Unauthorized', "API_ERROR", {}, 401);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMITED', {}, 429);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    console.log('Profile GET - Session user ID:', session.user.id, 'Type:', typeof session.user.id);
    console.log('Profile GET - Session is admin:', isAdmin(session));
    console.log('Profile GET - Is Organization:', isApprovedOrganization(session));

    if (session.user.accountType === 'organization') {
      const response = errorResponse('Organization accounts cannot access user profile endpoints. Use /api/organizations/me instead.', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const user = await ensureUserRow(supabase, session)
    console.log('Profile GET - User query result:', user ? 'Found' : 'Not found');
    
    if (!user) {
      console.log('Profile GET - User not found. Searched for ID:', session.user.id);
      const response = errorResponse('User not found', "API_ERROR", {}, 404);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const avatarPath = getUserAvatarPath((profile as any)?.avatar_metadata)
    const avatarUrl = await resolveProfileImageUrl(supabase, avatarPath, profile?.avatar || null)

    const { data: account } = await supabase
      .from('accounts')
      .select('url_handle')
      .eq('id', user.id)
      .single();

    const response = successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: avatarUrl,
        role: user.role,
        emailVerified: Boolean(session.user.emailVerified),
        createdAt: user.created_at,
        urlHandle: account?.url_handle || null,
      },
      profile: profile
        ? {
            ...profile,
            avatar: avatarUrl,
          }
        : null,
      isOrganization: false,
    });
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (error) {
    console.error('Profile fetch error:', error);
    const response = errorResponse('Internal server error', "API_ERROR", {}, 500);
    return response;
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'write',
      endpoint: '/api/users/profile',
    })

    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session?.user?.id) {
      const response = errorResponse('Unauthorized', "API_ERROR", {}, 401);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMITED', {}, 429);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const body = await request.json();

    if (session.user.accountType === 'organization') {
      const response = errorResponse('Organization accounts cannot access user profile endpoints. Use /api/organizations/me instead.', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const { name, bio, location, website, phone, dateOfBirth, gender, occupation, organization, interests, avatar, socialLinks, socialMedia, urlHandle } = body;

    if (name) {
      await supabase
        .from('users')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', session.user.id);
    }

    if (urlHandle !== undefined) {
      const normalizedHandle = urlHandle === '' ? null : String(urlHandle).toLowerCase().trim()
      const { error: handleError } = await supabase
        .from('accounts')
        .update({ url_handle: normalizedHandle, updated_at: new Date().toISOString() })
        .eq('id', session.user.id)
      if (handleError) {
        const msg = handleError.message || ''
        if (msg.includes('reserved') || msg.includes('Handle') || msg.includes('duplicate')) {
          const response = errorResponse(msg, 'HANDLE_UNAVAILABLE', {}, 400)
          for (const [key, value] of Object.entries(rateLimitHeaders)) {
            response.headers.set(key, value)
          }
          return response
        }
        const response = errorResponse('Failed to update handle', 'HANDLE_UPDATE_FAILED', {}, 500)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }
    }

    const updateData: any = {
      bio,
      location,
      website,
      phone,
      date_of_birth: dateOfBirth ? new Date(dateOfBirth).toISOString().split('T')[0] : undefined,
      gender,
      occupation,
      organization,
      interests,
      social_links: socialLinks,
      social_media: socialMedia || {},
    };

    if (avatar !== undefined) {
      if (typeof avatar === 'string' && avatar.startsWith('/api/images/')) {
        const response = errorResponse('Legacy blob image URLs are no longer supported. Upload profile image again.', 'VALIDATION_ERROR', {}, 400)
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value)
        }
        return response
      }
      updateData.avatar = avatar || null;
    }

    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    let updatedProfile = null;
    if (existingProfile?.id) {
      const { data } = await supabase
        .from('user_profiles')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', existingProfile.id)
        .select('*')
        .single();
      updatedProfile = data || null;
    } else {
      const { data } = await supabase
        .from('user_profiles')
        .insert({ user_id: session.user.id, ...updateData })
        .select('*')
        .single();
      updatedProfile = data || null;
    }

    const response = successResponse({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (error) {
    console.error('Profile update error:', error);
    const response = errorResponse('Internal server error', "API_ERROR", {}, 500);
    return response;
  }
}

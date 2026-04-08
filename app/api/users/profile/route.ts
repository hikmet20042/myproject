import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isAdmin, isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'

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

  if (existingUser) return existingUser

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
    const supabase = createSupabaseAdminClient()
  
  const session = await getServerSession()
    
    if (!session?.user?.id) {
      console.log('Profile GET - No session or user ID');
      return errorResponse('Unauthorized', "API_ERROR", {}, 401);
    }

    console.log('Profile GET - Session user ID:', session.user.id, 'Type:', typeof session.user.id);
    console.log('Profile GET - Session is admin:', isAdmin(session));
    console.log('Profile GET - Is Organization:', isApprovedOrganization(session));

    // Check if user is organization - if so, redirect to organization-specific profile endpoint
    if (isApprovedOrganization(session)) {
      return errorResponse('Organization profiles should use /api/organizations/me endpoint', "API_ERROR", {}, 400);
    }

    // Handle regular users
    const user = await ensureUserRow(supabase, session)
    console.log('Profile GET - User query result:', user ? 'Found' : 'Not found');
    
    if (!user) {
      console.log('Profile GET - User not found. Searched for ID:', session.user.id);
      return errorResponse('User not found', "API_ERROR", {}, 404);
    }

    // Use the user's _id for profile lookup
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: profile?.avatar || null,
        role: user.role,
        emailVerified: null,
        createdAt: user.created_at
      },
      profile: profile || null,
      isOrganization: false
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return errorResponse('Internal server error', "API_ERROR", {}, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401);
    }

    const body = await request.json();

    // Reject organization profile updates - they should use organization-specific endpoints
    if (isApprovedOrganization(session)) {
      return errorResponse('Organization profiles should use /api/organizations/me endpoint', "API_ERROR", {}, 400);
    }

    // Handle regular user profile updates
    const { name, bio, location, website, phone, dateOfBirth, gender, occupation, organization, interests, avatar, socialLinks, socialMedia } = body;

    // Update user basic info
    if (name) {
      await supabase
        .from('users')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', session.user.id);
    }

    // Handle avatar - extract blob ID if it's a blob URL
    let avatarBlobId: string | undefined = undefined;
    let avatarPath = avatar;

    const isUuid = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

    if (avatar && avatar.startsWith('/api/images/')) {
      // Extract blob ID from URL
      const blobId = avatar.replace('/api/images/', '');
      if (isUuid(blobId)) {
        avatarBlobId = blobId;
        avatarPath = undefined; // Clear legacy path when using blob
      }
    }

    // Upsert profile - use the user's _id as userId
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

    // Only update avatar fields if provided
    if (avatarBlobId) {
      updateData.avatar_blob_id = avatarBlobId;
      updateData.avatar = null; // Clear legacy field
    } else if (avatarPath) {
      updateData.avatar = avatarPath;
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

    return successResponse({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return errorResponse('Internal server error', "API_ERROR", {}, 500);
  }
}

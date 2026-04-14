import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { isAdmin } from '@/lib/auth/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return errorResponse('Authentication required', 'AUTH_REQUIRED', {}, 401);
    }

    const targetId = params.id;
    const isAdminUser = isAdmin(session);
    const isOwnProfile = session.user.id === targetId;

    // Only allow viewing your own profile or admin access
    if (!isOwnProfile && !isAdminUser) {
      return errorResponse('You can only view your own profile', 'FORBIDDEN', {}, 403);
    }

    const supabase = createSupabaseAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', targetId)
      .single();
    if (error || !user) {
      return errorResponse('User not found', "API_ERROR", {}, 404);
    }
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('avatar')
      .eq('user_id', targetId)
      .single();
    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        image: profile?.avatar || null,
        email: user.email,
        // Legacy display field only; never use users.role for authorization.
        role: user.role,
      },
    });
  } catch (error) {
    return errorResponse('Internal server error', "API_ERROR", {}, 500);
  }
}

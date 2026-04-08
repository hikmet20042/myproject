import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', params.id)
      .single();
    if (error || !user) {
      return errorResponse('User not found', "API_ERROR", {}, 404);
    }
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('avatar')
      .eq('user_id', params.id)
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

import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { isAdmin } from '@/lib/auth/permissions'
import { applyRateLimit } from '@/lib/rateLimit'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'authenticatedRead',
      endpoint: '/api/users/[id]',
    })

    const session = await getServerSession();
    if (!session?.user) {
      const response = errorResponse('Autentifikasiya tələb olunur', 'AUTH_REQUIRED', {}, 401);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMITED', {}, 429);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const targetId = params.id;
    const isAdminUser = isAdmin(session);
    const isOwnProfile = session.user.id === targetId;

    if (!isOwnProfile && !isAdminUser) {
      const response = errorResponse('Yalnız öz profilinizə baxa bilərsiniz', 'FORBIDDEN', {}, 403);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const supabase = createSupabaseAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', targetId)
      .single();
    if (error || !user) {
      const response = errorResponse('İstifadəçi tapılmadı', "API_ERROR", {}, 404);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('avatar')
      .eq('user_id', targetId)
      .single();
    const response = successResponse({
      user: {
        id: user.id,
        name: user.name,
        image: profile?.avatar || null,
        email: user.email,
        role: user.role,
      },
    });
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (error) {
    const response = errorResponse('Daxili server xətası', "API_ERROR", {}, 500);
    return response;
  }
}

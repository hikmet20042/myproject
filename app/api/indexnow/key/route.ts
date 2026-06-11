import { NextRequest } from 'next/server';
import { getIndexNowConfig } from '@/lib/indexnow';
import { errorResponse } from '@/lib/apiResponse';
import { getServerSession } from '@/lib/auth/server';
import { canAccessAdmin } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id || !canAccessAdmin(session)) {
    return errorResponse('Admin girişi tələb olunur', 'ADMIN_ACCESS_REQUIRED', {}, 403);
  }

  const config = getIndexNowConfig();

  if (!config) {
    return errorResponse('IndexNow konfiqurasiya edilməyib', 'SERVICE_UNAVAILABLE', {}, 503);
  }

  return new Response(config.apiKey, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

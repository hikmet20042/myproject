import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { submitToIndexNow, generateFullUrl } from '@/lib/indexnow';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { canAccessAdmin } from '@/lib/auth/permissions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return errorResponse('Autentifikasiya tələb olunur', 'AUTH_REQUIRED', {}, 401);
    }

    if (!canAccessAdmin(session)) {
      return errorResponse('Admin girişi tələb olunur', 'FORBIDDEN', {}, 403);
    }

    const body = await request.json();
    const { urls, type = 'update' } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return errorResponse('urls massivi tələb olunur', 'VALIDATION_ERROR', {}, 400);
    }

    const fullUrls = urls.map((url: string) => {
      if (url.startsWith('http')) return url;
      return generateFullUrl(url);
    });

    const result = await submitToIndexNow(fullUrls, type);

    if (result.success) {
      return successResponse(
        { submittedUrls: fullUrls.length, type },
        { message: `Successfully submitted ${fullUrls.length} URLs to IndexNow` }
      );
    } else {
      return errorResponse(result.error || 'IndexNow göndərmə uğursuz oldu', 'INDEXNOW_ERROR', {}, 500);
    }
  } catch (error) {
    console.error('IndexNow API error:', error);
    return errorResponse('IndexNow-a göndərilə bilmədi', 'INDEXNOW_ERROR', {}, 500);
  }
}

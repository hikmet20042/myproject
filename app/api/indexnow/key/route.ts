import { NextRequest } from 'next/server';
import { getIndexNowConfig } from '@/lib/indexnow';
import { errorResponse } from '@/lib/apiResponse';

export async function GET(request: NextRequest) {
  const config = getIndexNowConfig();

  if (!config) {
    return errorResponse('IndexNow not configured', 'SERVICE_UNAVAILABLE', {}, 503);
  }

  return new Response(config.apiKey, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

import { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

const rlh = (r: Response, h: Record<string, string>) => { for (const [k,v] of Object.entries(h)) r.headers.set(k,v); return r }

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return errorResponse('Legacy blob şəkil API-si köhnəlmişdir. Şəkli Cloudinary-yə yenidən yükləyin.', 'DEPRECATED_ENDPOINT', { id: params.id }, 410)
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return errorResponse('Legacy blob şəkil API-si köhnəlmişdir.', 'DEPRECATED_ENDPOINT', { id: params.id }, 410)
}

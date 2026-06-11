import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit } from '@/lib/rateLimit'
import { errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

function buildUnifiedSaveUrl(request: NextRequest, id: string): URL {
  const nextUrl = new URL(request.url)
  nextUrl.pathname = `/api/content/vacancy/${encodeURIComponent(id)}/save`
  return nextUrl
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { result: rateLimitResult, headers: rateLimitHeaders } = await applyRateLimit({
    request,
    preset: 'write',
    endpoint: '/api/vacancies/[id]/save',
  })

  if (!rateLimitResult.allowed) {
    const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }

  const response = NextResponse.redirect(buildUnifiedSaveUrl(request, params.id), 307)
  for (const [key, value] of Object.entries(rateLimitHeaders)) {
    response.headers.set(key, value)
  }
  return response
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { result: rateLimitResult, headers: rateLimitHeaders } = await applyRateLimit({
    request,
    preset: 'write',
    endpoint: '/api/vacancies/[id]/save',
  })

  if (!rateLimitResult.allowed) {
    const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }

  const response = NextResponse.redirect(buildUnifiedSaveUrl(request, params.id), 307)
  for (const [key, value] of Object.entries(rateLimitHeaders)) {
    response.headers.set(key, value)
  }
  return response
}

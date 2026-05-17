import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { canAccessAdmin } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
    request,
    preset: 'admin',
    endpoint: '/api/admin/cleanup-images',
  })

  if (!rateLimitResult.allowed) {
    const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response
  }

  const session = await getServerSession()
  if (!session?.user?.id) {
    const response = errorResponse('Unauthorized', 'API_ERROR', {}, 401)
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response
  }

  if (!canAccessAdmin(session)) {
    const response = errorResponse('Admin access required', 'API_ERROR', {}, 403)
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response
  }

  const response = successResponse({
    message: 'No-op: image blob cleanup endpoint is deprecated after migrating to Cloudinary and Supabase Storage.',
    deletedCount: 0,
  })
  for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
  return response
}

export async function GET(request: NextRequest) {
  const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
    request,
    preset: 'admin',
    endpoint: '/api/admin/cleanup-images',
  })

  if (!rateLimitResult.allowed) {
    const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response
  }

  const session = await getServerSession()
  if (!session?.user?.id) {
    const response = errorResponse('Unauthorized', 'API_ERROR', {}, 401)
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response
  }

  if (!canAccessAdmin(session)) {
    const response = errorResponse('Admin access required', 'API_ERROR', {}, 403)
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response
  }

  const response = successResponse({
    cleanup: { status: 'deprecated', unusedCount: 0, wouldDelete: 0 },
    storage: { note: 'Content images are now stored in Cloudinary; profile images are in Supabase Storage bucket.' },
  })
  for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
  return response
}

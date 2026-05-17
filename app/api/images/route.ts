import { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
    request,
    preset: 'publicRead',
    endpoint: '/api/images',
  })

  if (!rateLimitResult.allowed) {
    const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMITED', {}, 429)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }

  const response = errorResponse('Legacy blob image API is deprecated. Use Cloudinary for content images and /api/profile/image for profile images.', 'DEPRECATED_ENDPOINT', {}, 410)
  for (const [key, value] of Object.entries(rateLimitHeaders)) {
    response.headers.set(key, value)
  }
  return response
}

export async function DELETE(request: NextRequest) {
  const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
    request,
    preset: 'publicRead',
    endpoint: '/api/images',
  })

  if (!rateLimitResult.allowed) {
    const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMITED', {}, 429)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }

  const response = errorResponse('Legacy blob image API is deprecated.', 'DEPRECATED_ENDPOINT', {}, 410)
  for (const [key, value] of Object.entries(rateLimitHeaders)) {
    response.headers.set(key, value)
  }
  return response
}

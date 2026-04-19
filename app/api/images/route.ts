import { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return errorResponse('Legacy blob image API is deprecated. Use Cloudinary for content images and /api/profile/image for profile images.', 'DEPRECATED_ENDPOINT', {}, 410)
}

export async function DELETE(request: NextRequest) {
  return errorResponse('Legacy blob image API is deprecated.', 'DEPRECATED_ENDPOINT', {}, 410)
}

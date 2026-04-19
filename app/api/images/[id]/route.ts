import { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return errorResponse('Legacy blob image API is deprecated. Re-upload the image to Cloudinary.', 'DEPRECATED_ENDPOINT', { id: params.id }, 410)
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return errorResponse('Legacy blob image API is deprecated.', 'DEPRECATED_ENDPOINT', { id: params.id }, 410)
}

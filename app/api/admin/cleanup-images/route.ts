import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { canAccessAdmin } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 'API_ERROR', {}, 401)
  }

  if (!canAccessAdmin(session)) {
    return errorResponse('Admin access required', 'API_ERROR', {}, 403)
  }

  return successResponse({
    message: 'No-op: image blob cleanup endpoint is deprecated after migrating to Cloudinary and Supabase Storage.',
    deletedCount: 0,
  })
}

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 'API_ERROR', {}, 401)
  }

  if (!canAccessAdmin(session)) {
    return errorResponse('Admin access required', 'API_ERROR', {}, 403)
  }

  return successResponse({
    cleanup: {
      status: 'deprecated',
      unusedCount: 0,
      wouldDelete: 0,
    },
    storage: {
      note: 'Content images are now stored in Cloudinary; profile images are in Supabase Storage bucket.',
    },
  })
}

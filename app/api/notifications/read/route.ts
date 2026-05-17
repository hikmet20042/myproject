import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'write',
      endpoint: '/api/notifications/read',
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

    const body = await request.json().catch(() => ({}))
    const notificationId = typeof body?.notificationId === 'string' ? body.notificationId : null
    const markAllAsRead = Boolean(body?.markAllAsRead)
    const ownerColumn = isApprovedOrganization(session) ? 'organization_id' : 'user_id'
    const ownerId = session.user.id
    const supabase = createSupabaseAdminClient()

    if (markAllAsRead) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq(ownerColumn, ownerId)
        .eq('is_read', false)
      if (error) {
        const response = errorResponse(error.message, 'API_ERROR', {}, 500)
        for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
        return response
      }
      const response = successResponse({ message: 'All notifications marked as read' })
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    if (!notificationId) {
      const response = errorResponse('notificationId or markAllAsRead is required', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq(ownerColumn, ownerId)
      .select('*')
      .single()

    if (error || !notification) {
      const response = errorResponse('Notification not found', 'API_ERROR', {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const response = successResponse({ message: 'Notification marked as read', notification })
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response
  } catch (error) {
    console.error('Notification read error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}

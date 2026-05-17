import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { handleApiRequest, withRateLimitHeaders } from '@/lib/apiHelpers'

export async function POST(request: NextRequest) {
  try {
    const result = await handleApiRequest(request, {
      rateLimit: 'write',
      requireAuth: true,
      endpoint: '/api/notifications/read',
    })
    if (result instanceof Response) return result

    const { session, rateLimitHeaders } = result
    const body = await request.json().catch(() => ({}))
    const notificationId = typeof body?.notificationId === 'string' ? body.notificationId : null
    const markAllAsRead = Boolean(body?.markAllAsRead)
    const ownerColumn = isApprovedOrganization(session!) ? 'organization_id' : 'user_id'
    const ownerId = session!.user.id
    const supabase = createSupabaseAdminClient()

    if (markAllAsRead) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq(ownerColumn, ownerId)
        .eq('is_read', false)
      if (error) return withRateLimitHeaders(errorResponse(error.message, 'API_ERROR', {}, 500), rateLimitHeaders)
      return withRateLimitHeaders(successResponse({ message: 'All notifications marked as read' }), rateLimitHeaders)
    }

    if (!notificationId) {
      return withRateLimitHeaders(errorResponse('notificationId or markAllAsRead is required', 'API_ERROR', {}, 400), rateLimitHeaders)
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq(ownerColumn, ownerId)
      .select('*')
      .single()

    if (error || !notification) {
      return withRateLimitHeaders(errorResponse('Notification not found', 'API_ERROR', {}, 404), rateLimitHeaders)
    }

    return withRateLimitHeaders(successResponse({ message: 'Notification marked as read', notification }), rateLimitHeaders)
  } catch (error) {
    console.error('Notification read error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}

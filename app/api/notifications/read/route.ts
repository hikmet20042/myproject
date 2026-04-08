import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 'API_ERROR', {}, 401)
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
      if (error) return errorResponse(error.message, 'API_ERROR', {}, 500)
      return successResponse({ message: 'All notifications marked as read' })
    }

    if (!notificationId) {
      return errorResponse('notificationId or markAllAsRead is required', 'API_ERROR', {}, 400)
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq(ownerColumn, ownerId)
      .select('*')
      .single()

    if (error || !notification) {
      return errorResponse('Notification not found', 'API_ERROR', {}, 404)
    }

    return successResponse({ message: 'Notification marked as read', notification })
  } catch (error) {
    console.error('Notification read error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}

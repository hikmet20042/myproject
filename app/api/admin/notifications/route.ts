import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canAccessAdmin } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

const MASS_NOTIFICATION_RATE_LIMIT = 50 // Max 50 notifications per request
const MASS_NOTIFICATION_COOLDOWN = 60000 // 1 minute cooldown between mass sends

let lastMassNotificationTime = 0

function sanitizeInput(input: string | undefined | null): string {
  if (!input) return ''
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .slice(0, 500)
}

export const dynamic = 'force-dynamic'

// Get all notifications for admin management
export async function GET(request: NextRequest) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'admin', endpoint: '/api/admin/notifications' })
    if (!rlResult.allowed) {
      const r = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const session = await getServerSession()
    if (!session?.user || !canAccessAdmin(session)) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401)
    }

    const supabase = createSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')
    const isRead = searchParams.get('isRead')
    const skip = (page - 1) * limit

    // Build query - only show announcements sent by admin
    let query = supabase
      .from('notifications')
      .select('id, user_id (id, name, email), type, title, message, data, action_url, is_read, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1)

    // Only show announcements for admin notifications tab unless type explicitly provided
    if (type) {
      query = query.eq('type', type)
    } else {
      query = query.eq('type', 'announcement')
    }

    if (userId) query = query.eq('user_id', userId)
    if (isRead !== null && isRead !== undefined) {
      query = query.eq('is_read', isRead === 'true')
    }

    const { data: notifications, count: total, error } = await query

    if (error) {
      console.error('Admin notifications fetch error:', error)
      return errorResponse('Internal server error', "API_ERROR", {}, 500)
    }
    const safeTotal = total ?? 0
    const totalPages = Math.ceil(safeTotal / limit)

    // Get announcement statistics
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
    const [totalResult, unreadResult, readResult, todayResult] = await Promise.all([
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('type', 'announcement'),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('type', 'announcement').eq('is_read', false),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('type', 'announcement').eq('is_read', true),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('type', 'announcement').gte('created_at', todayStart)
    ])

    const stats = {
      total: totalResult.count || 0,
      unread: unreadResult.count || 0,
      read: readResult.count || 0,
      today: todayResult.count || 0
    }

    return successResponse({
      notifications,
      pagination: {
        page,
        limit,
        total: safeTotal,
        totalPages
      },
      stats
    })
  } catch (error) {
    console.error('Admin notifications fetch error:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}

// Send announcement or notification to users
export async function POST(request: NextRequest) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'admin', endpoint: '/api/admin/notifications' })
    if (!rlResult.allowed) {
      const r = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const session = await getServerSession()
    if (!session?.user || !canAccessAdmin(session)) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401)
    }

    const now = Date.now()
    if (now - lastMassNotificationTime < MASS_NOTIFICATION_COOLDOWN) {
      return errorResponse('Please wait before sending another mass notification', "API_ERROR", {}, 429)
    }

    const supabase = createSupabaseAdminClient()
    const body = await request.json()
    const { type, title, message, targetUsers, data } = body

    if (!type || !title || !message) {
      return errorResponse('Type, title and message are required', "API_ERROR", {}, 400)
    }

    const sanitizedTitle = sanitizeInput(title)
    const sanitizedMessage = sanitizeInput(message)

    let userIds: string[] = []

    if (targetUsers === 'all') {
      const { data: users } = await supabase.from('users').select('id')
      userIds = (users || []).map(user => user.id)
    } else if (targetUsers === 'verified') {
      const { data } = await supabase.auth.admin.listUsers()
      userIds = (data?.users || []).filter(user => !!user.email_confirmed_at).map(user => user.id)
    } else if (Array.isArray(targetUsers)) {
      userIds = targetUsers
    } else {
      return errorResponse('Invalid target users', "API_ERROR", {}, 400)
    }

    if (userIds.length > MASS_NOTIFICATION_RATE_LIMIT) {
      userIds = userIds.slice(0, MASS_NOTIFICATION_RATE_LIMIT)
    }

    lastMassNotificationTime = now

    // Create notifications for all target users
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type,
      title: sanitizedTitle,
      message: sanitizedMessage,
      data: data || {},
      is_read: false
    }))

    const { error: insertError } = await supabase.from('notifications').insert(notifications)

    if (insertError) {
      console.error('Admin notification send error:', insertError)
      return errorResponse('Internal server error', "API_ERROR", {}, 500)
    }

    return successResponse({
      message: `Notification sent to ${notifications.length} users`,
      count: notifications.length
    })
  } catch (error) {
    console.error('Admin notification send error:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}

// Delete notifications (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'admin', endpoint: '/api/admin/notifications' })
    if (!rlResult.allowed) {
      const r = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const session = await getServerSession()
    if (!session?.user || !canAccessAdmin(session)) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401)
    }

    const supabase = createSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const deleteAll = searchParams.get('deleteAll') === 'true'

    if (deleteAll) {
      // Delete all notifications (with optional filters)
      let deleteQuery = supabase.from('notifications').delete()
      if (userId) deleteQuery = deleteQuery.eq('user_id', userId)
      if (type) deleteQuery = deleteQuery.eq('type', type)
      const { data: deletedRows } = await deleteQuery
        .select('id')
        .throwOnError()
      return successResponse({
        message: `Deleted ${deletedRows?.length || 0} notifications`
      })
    } else if (notificationId) {
      // Delete specific notification
      const { data: deleted, error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .select('id')
        .single()
      if (error || !deleted) {
        return errorResponse('Notification not found', "API_ERROR", {}, 404)
      }
      return successResponse({ message: 'Notification deleted successfully' })
    } else {
      return errorResponse('Notification ID or deleteAll parameter required', "API_ERROR", {}, 400)
    }
  } catch (error) {
    console.error('Admin notification delete error:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}

// Update notification status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'admin', endpoint: '/api/admin/notifications' })
    if (!rlResult.allowed) {
      const r = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const session = await getServerSession()
    if (!session?.user || !canAccessAdmin(session)) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401)
    }

    const supabase = createSupabaseAdminClient()
    const body = await request.json()
    const { notificationId, isRead, markAllAsRead, userId, type, title, message, editAnnouncement } = body

    if (markAllAsRead) {
      // Mark all notifications as read (with optional filters)
      let updateQuery = supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)

      if (userId) updateQuery = updateQuery.eq('user_id', userId)
      if (type) updateQuery = updateQuery.eq('type', type)

      const { data: updatedRows } = await updateQuery
        .select('id')
        .throwOnError()
      return successResponse({
        message: `Marked ${updatedRows?.length || 0} notifications as read`
      })
    } else if (editAnnouncement && notificationId) {
      // Edit announcement content
      if (!title || !message) {
        return errorResponse('Title and message are required', "API_ERROR", {}, 400)
      }

      const sanitizedTitle = sanitizeInput(title)
      const sanitizedMessage = sanitizeInput(message)

      const { data: updated, error } = await supabase
        .from('notifications')
        .update({
          title: sanitizedTitle,
          message: sanitizedMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select('*')
        .single()
      
      if (error || !updated) {
        return errorResponse('Announcement not found', "API_ERROR", {}, 404)
      }
      
      return successResponse({
        message: 'Announcement updated successfully',
        notification: updated
      })
    } else if (notificationId && typeof isRead === 'boolean') {
      // Update specific notification
      const { data: updated, error } = await supabase
        .from('notifications')
        .update({ is_read: isRead })
        .eq('id', notificationId)
        .select('*')
        .single()
      
      if (error || !updated) {
        return errorResponse('Notification not found', "API_ERROR", {}, 404)
      }
      
      return successResponse({
        message: `Notification marked as ${isRead ? 'read' : 'unread'}`,
        notification: updated
      })
    } else {
      return errorResponse('Invalid request parameters', "API_ERROR", {}, 400)
    }
  } catch (error) {
    console.error('Admin notification update error:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}

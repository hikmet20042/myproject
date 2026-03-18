import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Get all notifications for admin management
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    return NextResponse.json({
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Send announcement or notification to users
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseAdminClient()
    const body = await request.json()
    const { type, title, message, targetUsers, data } = body

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Type, title, and message are required' }, { status: 400 })
    }

    let userIds: string[] = []

    if (targetUsers === 'all') {
      const { data: users } = await supabase.from('users').select('id')
      userIds = (users || []).map(user => user.id)
    } else if (targetUsers === 'verified') {
      const { data } = await supabase.auth.admin.listUsers()
      userIds = (data?.users || []).filter(user => !!user.email_confirmed_at).map(user => user.id)
    } else if (Array.isArray(targetUsers)) {
      // Send to specific users
      userIds = targetUsers
    } else {
      return NextResponse.json({ error: 'Invalid target users' }, { status: 400 })
    }

    // Create notifications for all target users
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type,
      title,
      message,
      data: data || {},
      is_read: false
    }))

    const { error: insertError } = await supabase.from('notifications').insert(notifications)

    if (insertError) {
      console.error('Admin notification send error:', insertError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Notification sent to ${notifications.length} users`,
      count: notifications.length
    })
  } catch (error) {
    console.error('Admin notification send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete notifications (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({
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
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
      }
      return NextResponse.json({ message: 'Notification deleted successfully' })
    } else {
      return NextResponse.json({ error: 'Notification ID or deleteAll parameter required' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin notification delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update notification status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({
        message: `Marked ${updatedRows?.length || 0} notifications as read`
      })
    } else if (editAnnouncement && notificationId) {
      // Edit announcement content
      if (!title || !message) {
        return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
      }

      const { data: updated, error } = await supabase
        .from('notifications')
        .update({
          title: title.trim(),
          message: message.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select('*')
        .single()
      
      if (error || !updated) {
        return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
      }
      
      return NextResponse.json({
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
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
      }
      
      return NextResponse.json({
        message: `Notification marked as ${isRead ? 'read' : 'unread'}`,
        notification: updated
      })
    } else {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin notification update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
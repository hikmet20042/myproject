import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import NotificationModel from '@/lib/models/Notification'
import User from '@/lib/models/User'

export const dynamic = 'force-dynamic'

// Get all notifications for admin management
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')
    const isRead = searchParams.get('isRead')
    const skip = (page - 1) * limit

    // Build query - only show announcements sent by admin
    const query: any = {
      type: 'announcement' // Only show announcements for admin notifications tab
    }
    if (type) query.type = type
    if (userId) query.userId = userId
    if (isRead !== null && isRead !== undefined) {
      query.isRead = isRead === 'true'
    }

    const notifications = await NotificationModel.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await NotificationModel.countDocuments(query)
    const totalPages = Math.ceil(total / limit)

    // Get announcement statistics
    const stats = await NotificationModel.aggregate([
      {
        $match: { type: 'announcement' } // Only count announcements
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
          read: { $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] } },
          today: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    '$createdAt',
                    new Date(new Date().setHours(0, 0, 0, 0))
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ])

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      stats: stats[0] || { total: 0, unread: 0, read: 0, today: 0 }
    })
  } catch (error) {
    console.error('Admin notifications fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Send announcement or notification to users
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()
    const { type, title, message, targetUsers, data } = body

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Type, title, and message are required' }, { status: 400 })
    }

    let userIds: string[] = []

    if (targetUsers === 'all') {
      // Send to all users
      const users = await User.find({}, '_id').lean()
      userIds = users.map(user => (user._id as any).toString())
    } else if (targetUsers === 'verified') {
      // Send to verified users only
      const users = await User.find({ emailVerified: { $ne: null } }, '_id').lean()
      userIds = users.map(user => (user._id as any).toString())
    } else if (Array.isArray(targetUsers)) {
      // Send to specific users
      userIds = targetUsers
    } else {
      return NextResponse.json({ error: 'Invalid target users' }, { status: 400 })
    }

    // Create notifications for all target users
    const notifications = userIds.map(userId => ({
      userId,
      type,
      title,
      message,
      data: data || {},
      isRead: false
    }))

    const result = await NotificationModel.insertMany(notifications)

    return NextResponse.json({
      message: `Notification sent to ${result.length} users`,
      count: result.length
    })
  } catch (error) {
    console.error('Admin notification send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete notifications (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const deleteAll = searchParams.get('deleteAll') === 'true'

    if (deleteAll) {
      // Delete all notifications (with optional filters)
      const query: any = {}
      if (userId) query.userId = userId
      if (type) query.type = type
      
      const result = await NotificationModel.deleteMany(query)
      return NextResponse.json({
        message: `Deleted ${result.deletedCount} notifications`
      })
    } else if (notificationId) {
      // Delete specific notification
      const result = await NotificationModel.findByIdAndDelete(notificationId)
      if (!result) {
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
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()
    const { notificationId, isRead, markAllAsRead, userId, type, title, message, editAnnouncement } = body

    if (markAllAsRead) {
      // Mark all notifications as read (with optional filters)
      const query: any = { isRead: false }
      if (userId) query.userId = userId
      if (type) query.type = type
      
      const result = await NotificationModel.updateMany(query, { isRead: true })
      return NextResponse.json({
        message: `Marked ${result.modifiedCount} notifications as read`
      })
    } else if (editAnnouncement && notificationId) {
      // Edit announcement content
      if (!title || !message) {
        return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
      }

      const result = await NotificationModel.findByIdAndUpdate(
        notificationId,
        { 
          title: title.trim(),
          message: message.trim(),
          updatedAt: new Date()
        },
        { new: true }
      )
      
      if (!result) {
        return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
      }
      
      return NextResponse.json({
        message: 'Announcement updated successfully',
        notification: result
      })
    } else if (notificationId && typeof isRead === 'boolean') {
      // Update specific notification
      const result = await NotificationModel.findByIdAndUpdate(
        notificationId,
        { isRead },
        { new: true }
      )
      
      if (!result) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
      }
      
      return NextResponse.json({
        message: `Notification marked as ${isRead ? 'read' : 'unread'}`,
        notification: result
      })
    } else {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin notification update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
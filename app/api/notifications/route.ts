import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import NotificationModel from '@/lib/models/Notification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';
    let query: any = { userId: session.user.id };
    if (unreadOnly) query.isRead = false;
    let notifications = await NotificationModel.find(query).sort({ createdAt: -1 }).lean();
    const unreadCount = await NotificationModel.countDocuments({ userId: session.user.id, isRead: false });
    return NextResponse.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { notificationId, markAllAsRead, isRead } = body;
    if (markAllAsRead) {
      await NotificationModel.updateMany({ userId: session.user.id, isRead: false }, { $set: { isRead: true } });
      return NextResponse.json({ message: 'All notifications marked as read' });
    } else if (notificationId && typeof isRead === 'boolean') {
      const updated = await NotificationModel.findOneAndUpdate(
        { _id: notificationId, userId: session.user.id },
        { isRead },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }
      return NextResponse.json({
        message: `Notification marked as ${isRead ? 'read' : 'unread'}`,
        notification: updated
      });
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');
    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }
  await NotificationModel.findOneAndDelete({ _id: notificationId, userId: session.user.id });
    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Notification delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

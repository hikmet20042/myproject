import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import NotificationModel from '@/lib/models/Notification'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isRead } = body;
    const notificationId = params.id;

    if (typeof isRead !== 'boolean') {
      return NextResponse.json({ error: 'isRead must be a boolean' }, { status: 400 });
    }

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
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

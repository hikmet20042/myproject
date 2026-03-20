import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';
    
    // Build query based on account type (organization or user)
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (session.user.organizationStatus === 'approved') {
      query = query.eq('organization_id', session.user.id);
    } else {
      query = query.eq('user_id', session.user.id);
    }
    
    if (unreadOnly) query = query.eq('is_read', false);
    
    const { data: notifications, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    
    let unreadCountQuery = supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);
    unreadCountQuery = session.user.organizationStatus === 'approved'
      ? unreadCountQuery.eq('organization_id', session.user.id)
      : unreadCountQuery.eq('user_id', session.user.id);
    const { count: unreadCount } = await unreadCountQuery;
    
    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { notificationId, markAllAsRead, isRead } = body;
    
    // Build query based on account type
    const ownerColumn = session.user.organizationStatus === 'approved' ? 'organization_id' : 'user_id';
    const ownerId = session.user.id;
    
    if (markAllAsRead) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq(ownerColumn, ownerId)
        .eq('is_read', false);
      return NextResponse.json({ message: 'All notifications marked as read' });
    } else if (notificationId && typeof isRead === 'boolean') {
      const { data: updated, error } = await supabase
        .from('notifications')
        .update({ is_read: isRead })
        .eq('id', notificationId)
        .eq(ownerColumn, ownerId)
        .select('*')
        .single();
      if (error || !updated) {
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
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');
    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }
    
    // Build query based on account type
    const ownerColumn = session.user.organizationStatus === 'approved' ? 'organization_id' : 'user_id';
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq(ownerColumn, session.user.id);
    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Notification delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

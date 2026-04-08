import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401);
    }
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';
    const limitParam = parseInt(url.searchParams.get('limit') || '10', 10)
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 10) : 10
    
    // Build query based on account type (organization or user)
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (isApprovedOrganization(session)) {
      query = query.eq('organization_id', session.user.id);
    } else {
      query = query.eq('user_id', session.user.id);
    }
    
    if (unreadOnly) query = query.eq('is_read', false);
    
    const { data: notifications, error } = await query;
    if (error) {
      return errorResponse('Internal server error', "API_ERROR", {}, 500);
    }
    
    let unreadCountQuery = supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);
    unreadCountQuery = isApprovedOrganization(session)
      ? unreadCountQuery.eq('organization_id', session.user.id)
      : unreadCountQuery.eq('user_id', session.user.id);
    const { count: unreadCount } = await unreadCountQuery;
    
    return successResponse({
      notifications: notifications || [],
      unreadCount: unreadCount || 0
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return errorResponse('Internal server error', "API_ERROR", {}, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401);
    }
    const body = await request.json();
    const { notificationId, markAllAsRead, isRead } = body;
    
    // Build query based on account type
    const ownerColumn = isApprovedOrganization(session) ? 'organization_id' : 'user_id';
    const ownerId = session.user.id;
    
    if (markAllAsRead) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq(ownerColumn, ownerId)
        .eq('is_read', false)
        .select('id');

      return successResponse({ message: 'All notifications marked as read' });
    } else if (notificationId && typeof isRead === 'boolean') {
      const { data: updated, error } = await supabase
        .from('notifications')
        .update({ is_read: isRead })
        .eq('id', notificationId)
        .eq(ownerColumn, ownerId)
        .select('*')
        .single();
      if (error || !updated) {
        return errorResponse('Notification not found', "API_ERROR", {}, 404);
      }

      return successResponse({
        message: `Notification marked as ${isRead ? 'read' : 'unread'}`,
        notification: updated
      });
    }
    return errorResponse('Invalid request', "API_ERROR", {}, 400);
  } catch (error) {
    console.error('Notification update error:', error);
    return errorResponse('Internal server error', "API_ERROR", {}, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401);
    }
    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');
    if (!notificationId) {
      return errorResponse('Notification ID required', "API_ERROR", {}, 400);
    }
    
    // Build query based on account type
    const ownerColumn = isApprovedOrganization(session) ? 'organization_id' : 'user_id';
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq(ownerColumn, session.user.id);
    return successResponse({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Notification delete error:', error);
    return errorResponse('Internal server error', "API_ERROR", {}, 500);
  }
}

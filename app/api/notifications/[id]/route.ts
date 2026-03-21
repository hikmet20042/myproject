import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isRead } = body;
    const notificationId = params.id;

    if (typeof isRead !== 'boolean') {
      return NextResponse.json({ error: 'isRead must be a boolean' }, { status: 400 });
    }

    const ownerColumn = session.user.accountType === 'organization' && session.user.organizationStatus === 'approved' ? 'organization_id' : 'user_id'
    const { data: updated, error } = await supabase
      .from('notifications')
      .update({ is_read: isRead })
      .eq('id', notificationId)
      .eq(ownerColumn, session.user.id)
      .select('*')
      .single();

    if (error || !updated) {
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

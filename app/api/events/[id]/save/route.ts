import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();
    
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse('Authentication required', 'AUTH_REQUIRED', {}, 401);
    }
    
    const eventId = params.id;
    const userId = session.user.id;
    
    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .single();
    if (eventError || !event) {
      return errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404);
    }
    
    const { data: existingSave } = await supabase
      .from('content_saves')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', 'event')
      .eq('content_id', eventId)
      .maybeSingle()
    
    let action: 'saved' | 'unsaved';
    
    if (existingSave?.id) {
      await supabase.from('content_saves').delete().eq('id', existingSave.id);
      action = 'unsaved';
    } else {
      await supabase.from('content_saves').insert({
        user_id: userId,
        content_type: 'event',
        content_id: eventId,
      });
      action = 'saved';
    }
    
    return successResponse({
      action,
      hasSaved: action === 'saved'
    });
    
  } catch (error) {
    console.error('Save/unsave event error:', error);
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500);
  }
}

// Get save status for current user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();
    
    const session = await getServerSession();
    if (!session?.user?.id) {
      return successResponse({ hasSaved: false, canSave: false });
    }
    
    const eventId = params.id;
    const userId = session.user.id;
    
    const { data: saveRow, error: saveError } = await supabase
      .from('content_saves')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', 'event')
      .eq('content_id', eventId)
      .maybeSingle();
    if (saveError) {
      return errorResponse('Failed to fetch save state', 'API_ERROR', {}, 500);
    }
    
    const hasSaved = Boolean(saveRow?.id);
    
    return successResponse({
      hasSaved,
      canSave: true
    });
    
  } catch (error) {
    console.error('Get save status error:', error);
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500);
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();
    
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
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
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Find the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, saved_events')
      .eq('id', userId)
      .single();
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user already saved this event
    const savedEvents = Array.isArray(user.saved_events) ? user.saved_events : [];
    const hasSaved = savedEvents.some((id: any) => id.toString() === eventId);
    
    let action: 'saved' | 'unsaved';
    
    if (hasSaved) {
      // Unsave the event
      const updated = savedEvents.filter((id: any) => id.toString() !== eventId);
      await supabase.from('users').update({ saved_events: updated }).eq('id', userId);
      action = 'unsaved';
    } else {
      // Save the event
      const updated = [...savedEvents, eventId];
      await supabase.from('users').update({ saved_events: updated }).eq('id', userId);
      action = 'saved';
    }
    
    return NextResponse.json({
      success: true,
      action,
      hasSaved: !hasSaved
    });
    
  } catch (error) {
    console.error('Save/unsave event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json({ hasSaved: false, canSave: false });
    }
    
    const eventId = params.id;
    const userId = session.user.id;
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('saved_events')
      .eq('id', userId)
      .single();
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const savedEvents = Array.isArray(user.saved_events) ? user.saved_events : [];
    const hasSaved = savedEvents.some((id: any) => id.toString() === eventId) || false;
    
    return NextResponse.json({
      hasSaved,
      canSave: true
    });
    
  } catch (error) {
    console.error('Get save status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import Event from '@/lib/models/Event'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const eventId = params.id;
    const userId = session.user.id;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user already saved this event
    if (!user.savedEvents) user.savedEvents = [];
    const hasSaved = user.savedEvents.some((id: any) => id.toString() === eventId);
    
    let action: 'saved' | 'unsaved';
    
    if (hasSaved) {
      // Unsave the event
      user.savedEvents = user.savedEvents.filter((id: any) => id.toString() !== eventId);
      action = 'unsaved';
    } else {
      // Save the event
      user.savedEvents.push(eventId);
      action = 'saved';
    }
    
    await user.save();
    
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
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ hasSaved: false, canSave: false });
    }
    
    const eventId = params.id;
    const userId = session.user.id;
    
    const user = await User.findById(userId).select('savedEvents');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const hasSaved = user.savedEvents?.some((id: any) => id.toString() === eventId) || false;
    
    return NextResponse.json({
      hasSaved,
      canSave: true
    });
    
  } catch (error) {
    console.error('Get save status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

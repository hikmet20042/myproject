import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Event from '@/lib/models/Event'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const eventId = params.id;
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id;
    
    // Get client IP for unique view tracking
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    
    // Get user agent for analytics
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Parse request body for client-side tracking info
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    
    const { isFirstView = true } = body;
    
    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only track views for approved events
    if (event.status !== 'approved') {
      return NextResponse.json({
        success: false,
        message: 'Views only tracked for approved content',
        views: event.views || 0,
        uniqueViews: event.uniqueViews || 0,
        viewIncremented: false
      });
    }

    // Check if this is a unique view
    let isUniqueView = false;
    let viewIncremented = false;
    
    if (viewerId) {
      // For logged-in users, check if they haven't viewed this event before
      const alreadyViewed = event.viewedBy?.some(
        (id: any) => id.toString() === viewerId.toString()
      );
      
      if (!alreadyViewed) {
        isUniqueView = true;
        if (!event.viewedBy) event.viewedBy = [];
        event.viewedBy.push(viewerId);
        event.uniqueViews = (event.uniqueViews || 0) + 1;
      }
      
      // Always increment total views for authenticated users
      event.views = (event.views || 0) + 1;
      viewIncremented = true;
      
    } else {
      // For anonymous users, rely on client-side tracking (session storage)
      if (isFirstView) {
        isUniqueView = true;
        event.uniqueViews = (event.uniqueViews || 0) + 1;
        event.views = (event.views || 0) + 1;
        viewIncremented = true;
      }
    }
    
    // Calculate engagement score (views * 1 + likes * 3 - dislikes * 2)
    if (viewIncremented) {
      const engagementScore = (event.views * 1) + 
                             ((event.likes || 0) * 3) - 
                             ((event.dislikes || 0) * 2);
      event.engagementScore = Math.max(0, engagementScore);
      
      await event.save();
    }
    
    return NextResponse.json({
      success: true,
      views: event.views || 0,
      uniqueViews: event.uniqueViews || 0,
      likes: event.likes || 0,
      dislikes: event.dislikes || 0,
      engagementScore: event.engagementScore || 0,
      isUniqueView,
      viewIncremented
    });
    
  } catch (error) {
    console.error('View tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get view count and analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const eventId = params.id;
    const event = await Event.findById(eventId).select('views uniqueViews likes dislikes engagementScore');
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      views: event.views || 0,
      uniqueViews: event.uniqueViews || 0,
      likes: event.likes || 0,
      dislikes: event.dislikes || 0,
      engagementScore: event.engagementScore || 0
    });
    
  } catch (error) {
    console.error('Get view count error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Vacancy from '@/lib/models/Vacancy'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const vacancyId = params.id;
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
    
    // Find the vacancy
    const vacancy = await Vacancy.findById(vacancyId);
    if (!vacancy) {
      return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });
    }

    // Only track views for approved vacancies
    if (vacancy.status !== 'approved') {
      return NextResponse.json({
        success: false,
        message: 'Views only tracked for approved content',
        views: vacancy.views || 0,
        uniqueViews: vacancy.uniqueViews || 0,
        viewIncremented: false
      });
    }

    // Check if this is a unique view
    let isUniqueView = false;
    let viewIncremented = false;
    
    if (viewerId) {
      // For logged-in users, check if they haven't viewed this vacancy before
      const alreadyViewed = vacancy.viewedBy?.some(
        (id: any) => id.toString() === viewerId.toString()
      );
      
      if (!alreadyViewed) {
        isUniqueView = true;
        if (!vacancy.viewedBy) vacancy.viewedBy = [];
        vacancy.viewedBy.push(viewerId);
        vacancy.uniqueViews = (vacancy.uniqueViews || 0) + 1;
      }
      
      // Always increment total views for authenticated users
      vacancy.views = (vacancy.views || 0) + 1;
      viewIncremented = true;
      
    } else {
      // For anonymous users, rely on client-side tracking (session storage)
      if (isFirstView) {
        isUniqueView = true;
        vacancy.uniqueViews = (vacancy.uniqueViews || 0) + 1;
        vacancy.views = (vacancy.views || 0) + 1;
        viewIncremented = true;
      }
    }
    
    // Calculate engagement score (views * 1 + likes * 3 - dislikes * 2)
    if (viewIncremented) {
      const engagementScore = (vacancy.views * 1) + 
                             ((vacancy.likes || 0) * 3) - 
                             ((vacancy.dislikes || 0) * 2);
      vacancy.engagementScore = Math.max(0, engagementScore);
      
      await vacancy.save();
    }
    
    return NextResponse.json({
      success: true,
      views: vacancy.views || 0,
      uniqueViews: vacancy.uniqueViews || 0,
      likes: vacancy.likes || 0,
      dislikes: vacancy.dislikes || 0,
      engagementScore: vacancy.engagementScore || 0,
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
    
    const vacancyId = params.id;
    const vacancy = await Vacancy.findById(vacancyId).select('views uniqueViews likes dislikes engagementScore');
    
    if (!vacancy) {
      return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      views: vacancy.views || 0,
      uniqueViews: vacancy.uniqueViews || 0,
      likes: vacancy.likes || 0,
      dislikes: vacancy.dislikes || 0,
      engagementScore: vacancy.engagementScore || 0
    });
    
  } catch (error) {
    console.error('Get view count error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

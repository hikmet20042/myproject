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
    
    const blogId = params.id;
    const session = await getServerSession();
    const viewerId = session?.user?.id;
    
    // Get client IP for unique view tracking
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : (request.headers.get('x-real-ip') || 'unknown');
    
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
    
    // Find the blog
    const { data: blog, error } = await supabase
      .from('blogs')
      .select('id, status, views, unique_views, viewed_by, likes, dislikes, engagement_score, author_id')
      .eq('id', blogId)
      .single();
    if (error || !blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Only track views for approved blogs
    if (blog.status !== 'approved') {
      return NextResponse.json({
        success: false,
        message: 'Views only tracked for approved content',
        views: blog.views || 0,
        uniqueViews: blog.unique_views || 0,
        viewIncremented: false
      });
    }

    // Check if this is a unique view
    let isUniqueView = false;
    let viewIncremented = false;
    
    if (viewerId) {
      // For logged-in users, check if they haven't viewed this blog before
      const viewedBy = Array.isArray(blog.viewed_by) ? blog.viewed_by : [];
      const alreadyViewed = viewedBy.some((id: any) => id.toString() === viewerId.toString());
      
      if (!alreadyViewed) {
        isUniqueView = true;
        viewedBy.push(viewerId);
        blog.viewed_by = viewedBy;
        blog.unique_views = (blog.unique_views || 0) + 1;
      }
      
      // Always increment total views for authenticated users
      blog.views = (blog.views || 0) + 1;
      viewIncremented = true;
      
    } else {
      // For anonymous users, rely on client-side tracking (session storage)
      if (isFirstView) {
        isUniqueView = true;
        blog.unique_views = (blog.unique_views || 0) + 1;
        blog.views = (blog.views || 0) + 1;
        viewIncremented = true;
      }
    }
    
    // Calculate engagement score (views * 1 + likes * 3 - dislikes * 2)
    if (viewIncremented) {
      const engagementScore = (blog.views * 1) +
                             ((blog.likes || 0) * 3) -
                             ((blog.dislikes || 0) * 2);
      const engagementScoreValue = Math.max(0, engagementScore);
      
      await supabase
        .from('blogs')
        .update({
          views: blog.views,
          unique_views: blog.unique_views,
          viewed_by: blog.viewed_by || [],
          engagement_score: engagementScoreValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', blogId);
    }
    
    // Return updated stats
    return NextResponse.json({
      success: true,
      views: blog.views || 0,
      uniqueViews: blog.unique_views || 0,
      likes: blog.likes || 0,
      dislikes: blog.dislikes || 0,
      engagementScore: blog.engagement_score || 0,
      isUniqueView,
      viewIncremented
    });
    
  } catch (error) {
    console.error('View tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get view statistics for a blog
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();
    
    const blogId = params.id;
    
    const { data: blog, error } = await supabase
      .from('blogs')
      .select('views, unique_views, likes, engagement_score')
      .eq('id', blogId)
      .single();
    if (error || !blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    
    // Get view analytics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const viewAnalytics: any[] = [];
    
    return NextResponse.json({
      views: blog.views || 0,
      uniqueViews: blog.unique_views || 0,
      likes: blog.likes || 0,
      engagementScore: blog.engagement_score || 0,
      dailyAnalytics: viewAnalytics
    });
    
  } catch (error) {
    console.error('View analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

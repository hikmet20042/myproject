import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { isAdmin } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();

    const eventId = params.slug;
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

    // Find the event
    const { data: event, error } = await supabase
      .from('events')
      .select('id, status, views, unique_views, viewed_by, engagement_score')
      .eq('slug', eventId)
      .single();
    if (error || !event) {
      return errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404);
    }

    // Only track views for approved events
    if (event.status !== 'approved') {
      return successResponse({
        message: 'Views only tracked for approved content',
        views: event.views || 0,
        uniqueViews: event.unique_views || 0,
        viewIncremented: false
      });
    }

    // Check if this is a unique view
    let isUniqueView = false;
    let viewIncremented = false;

    if (viewerId) {
      // For logged-in users, check if they haven't viewed this event before
      const viewedBy = Array.isArray(event.viewed_by) ? event.viewed_by : [];
      const alreadyViewed = viewedBy.some((id: any) => id.toString() === viewerId.toString());

      if (!alreadyViewed) {
        isUniqueView = true;
        viewedBy.push(viewerId);
        event.viewed_by = viewedBy;
        event.unique_views = (event.unique_views || 0) + 1;
      }

      // Always increment total views for authenticated users
      event.views = (event.views || 0) + 1;
      viewIncremented = true;

    } else {
      // For anonymous users, rely on client-side tracking (session storage)
      if (isFirstView) {
        isUniqueView = true;
        event.unique_views = (event.unique_views || 0) + 1;
        event.views = (event.views || 0) + 1;
        viewIncremented = true;
      }
    }

    // Calculate engagement score (views * 1 + likes * 3 - dislikes * 2)
    if (viewIncremented) {
      const engagementScore = (event.views * 1);
      const engagementScoreValue = Math.max(0, engagementScore);

      const { error: updateError } = await supabase
        .from('events')
        .update({
          views: event.views,
          unique_views: event.unique_views,
          viewed_by: event.viewed_by || [],
          engagement_score: engagementScoreValue,
          updated_at: new Date().toISOString()
        })
        .eq('slug', eventId);

      if (updateError) {
        console.error('View tracking update error:', updateError);
      }
    }

    return successResponse({
      views: event.views || 0,
      uniqueViews: event.unique_views || 0,
      likes: 0,
      dislikes: 0,
      engagementScore: event.engagement_score || 0,
      isUniqueView,
      viewIncremented
    });

  } catch (error) {
    console.error('View tracking error:', error);
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500);
  }
}

// Get view count and analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();

    const eventId = params.slug;
    const { data: event, error } = await supabase
      .from('events')
      .select('views, unique_views, engagement_score, status, created_by, created_by_organization')
      .eq('slug', eventId)
      .single();

    if (error || !event) {
      return errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404);
    }

    // Only return stats for approved events, or for creator/admin of non-approved events
    if (event.status !== 'approved') {
      const isAdminUser = isAdmin(session)
      const isCreator = session?.user?.id === event.created_by || session?.user?.id === event.created_by_organization
      if (!isCreator && !isAdminUser) {
        return errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404)
      }
    }

    return successResponse({
      views: event.views || 0,
      uniqueViews: event.unique_views || 0,
      likes: 0,
      dislikes: 0,
      engagementScore: event.engagement_score || 0
    });

  } catch (error) {
    console.error('Get view count error:', error);
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500);
  }
}

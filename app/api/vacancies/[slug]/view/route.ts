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

    const vacancyId = params.slug;
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

    // Find the vacancy
    const { data: vacancy, error } = await supabase
      .from('vacancies')
      .select('id, status, views, unique_views, viewed_by, engagement_score')
      .eq('slug', vacancyId)
      .single();
    if (error || !vacancy) {
      return errorResponse('Vacancy not found', "API_ERROR", {}, 404);
    }

    // Only track views for approved vacancies
    if (vacancy.status !== 'approved') {
      return successResponse({
        success: false,
        message: 'Views only tracked for approved content',
        views: vacancy.views || 0,
        uniqueViews: vacancy.unique_views || 0,
        viewIncremented: false
      });
    }

    // Check if this is a unique view
    let isUniqueView = false;
    let viewIncremented = false;

    if (viewerId) {
      // For logged-in users, check if they haven't viewed this vacancy before
      const viewedBy = Array.isArray(vacancy.viewed_by) ? vacancy.viewed_by : [];
      const alreadyViewed = viewedBy.some(
        (id: any) => id.toString() === viewerId.toString()
      );

      if (!alreadyViewed) {
        isUniqueView = true;
        viewedBy.push(viewerId);
        vacancy.viewed_by = viewedBy;
        vacancy.unique_views = (vacancy.unique_views || 0) + 1;
      }

      // Always increment total views for authenticated users
        vacancy.views = (vacancy.views || 0) + 1;
      viewIncremented = true;

    } else {
      // For anonymous users, rely on client-side tracking (session storage)
      if (isFirstView) {
        isUniqueView = true;
        vacancy.unique_views = (vacancy.unique_views || 0) + 1;
        vacancy.views = (vacancy.views || 0) + 1;
        viewIncremented = true;
      }
    }

    // Calculate engagement score (views * 1 + likes * 3 - dislikes * 2)
    if (viewIncremented) {
      const engagementScore = (vacancy.views * 1);
      const engagementScoreValue = Math.max(0, engagementScore);

      const { error: updateError } = await supabase
        .from('vacancies')
        .update({
          views: vacancy.views,
          unique_views: vacancy.unique_views,
          viewed_by: vacancy.viewed_by || [],
          engagement_score: engagementScoreValue,
          updated_at: new Date().toISOString()
        })
        .eq('slug', vacancyId);

      if (updateError) {
        console.error('View tracking update error:', updateError);
      }
    }

    return successResponse({
      success: true,
      views: vacancy.views || 0,
      uniqueViews: vacancy.unique_views || 0,
      likes: 0,
      dislikes: 0,
      engagementScore: vacancy.engagement_score || 0,
      isUniqueView,
      viewIncremented
    });

  } catch (error) {
    console.error('View tracking error:', error);
    return errorResponse('Internal server error', "API_ERROR", {}, 500);
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

    const vacancyId = params.slug;
    const { data: vacancy, error } = await supabase
      .from('vacancies')
      .select('views, unique_views, engagement_score, status, created_by, created_by_organization')
      .eq('slug', vacancyId)
      .single();

    if (error || !vacancy) {
      return errorResponse('Vacancy not found', "API_ERROR", {}, 404);
    }

    // Only return stats for approved vacancies, or for creator/admin of non-approved
    if (vacancy.status !== 'approved') {
      const isAdminUser = isAdmin(session)
      const isCreator = session?.user?.id === vacancy.created_by || session?.user?.id === vacancy.created_by_organization
      if (!isCreator && !isAdminUser) {
        return errorResponse('Vacancy not found', "API_ERROR", {}, 404)
      }
    }

    return successResponse({
      views: vacancy.views || 0,
      uniqueViews: vacancy.unique_views || 0,
      likes: 0,
      dislikes: 0,
      engagementScore: vacancy.engagement_score || 0
    });

  } catch (error) {
    console.error('Get view count error:', error);
    return errorResponse('Internal server error', "API_ERROR", {}, 500);
  }
}

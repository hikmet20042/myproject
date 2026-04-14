import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { NotificationService } from '@/features/notifications/services/notificationService'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();

    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse('Authentication required', "API_ERROR", {}, 401);
    }

    const vacancyId = params.slug;
    const userId = session.user.id;

    // Check if vacancy exists
    const { data: vacancy, error: vacancyError } = await supabase
      .from('vacancies')
      .select('id, title, created_by, created_by_organization')
      .eq('slug', vacancyId)
      .single();
    if (vacancyError || !vacancy) {
      return errorResponse('Vacancy not found', "API_ERROR", {}, 404);
    }

    const { data: existingSave } = await supabase
      .from('content_saves')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', 'vacancy')
      .eq('content_id', vacancyId)
      .maybeSingle();

    let action: 'saved' | 'unsaved';

    if (existingSave?.id) {
      await supabase.from('content_saves').delete().eq('id', existingSave.id);
      action = 'unsaved';
    } else {
      await supabase.from('content_saves').insert({
        user_id: userId,
        content_type: 'vacancy',
        content_id: vacancyId,
      });
      action = 'saved';

      try {
        const ownerUserId = vacancy.created_by ? String(vacancy.created_by) : null
        const ownerOrganizationId = vacancy.created_by_organization ? String(vacancy.created_by_organization) : null
        const shouldNotifyUser = Boolean(ownerUserId && ownerUserId !== userId)
        const shouldNotifyOrganization = Boolean(ownerOrganizationId && ownerOrganizationId !== userId)

        if (shouldNotifyUser || shouldNotifyOrganization) {
          await NotificationService.notifyContentSaved({
            recipientUserId: shouldNotifyUser ? ownerUserId || undefined : undefined,
            recipientOrganizationId: shouldNotifyOrganization ? ownerOrganizationId || undefined : undefined,
            contentType: 'vacancy',
            contentId: vacancyId,
            contentTitle: vacancy.title || 'Untitled',
          })
        }
      } catch (notificationError) {
        console.error('Failed to notify vacancy owner about save:', notificationError)
      }
    }

    return successResponse({
      success: true,
      action,
      hasSaved: action === 'saved'
    });

  } catch (error) {
    console.error('Save/unsave vacancy error:', error);
    return errorResponse('Internal server error', "API_ERROR", {}, 500);
  }
}

// Get save status for current user
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();

    const session = await getServerSession();
    if (!session?.user?.id) {
      return successResponse({ hasSaved: false, canSave: false });
    }

    const vacancyId = params.slug;
    const userId = session.user.id;

    const { data: saveRow, error: saveError } = await supabase
      .from('content_saves')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', 'vacancy')
      .eq('content_id', vacancyId)
      .maybeSingle();
    if (saveError) {
      return errorResponse('Failed to fetch save state', "API_ERROR", {}, 500);
    }

    const hasSaved = Boolean(saveRow?.id);

    return successResponse({
      hasSaved,
      canSave: true
    });

  } catch (error) {
    console.error('Get save status error:', error);
    return errorResponse('Internal server error', "API_ERROR", {}, 500);
  }
}

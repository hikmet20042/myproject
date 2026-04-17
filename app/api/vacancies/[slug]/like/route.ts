import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

export const dynamic = 'force-dynamic'

// POST /api/vacancies/[slug]/like - Toggle like reaction on a vacancy
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()

    if (!session?.user?.id) {
      return errorResponse('Authentication required', 'AUTH_REQUIRED', {}, 401)
    }

    const vacancyIdentifier = params.slug

    if (!vacancyIdentifier) {
      return errorResponse('Vacancy identifier is required', 'VALIDATION_ERROR', {}, 400)
    }

    const { data: resolvedVacancy, error: resolveError } = await resolveEntityBySlugOrId(
      supabase,
      'vacancies',
      vacancyIdentifier,
      'id'
    )

    if (resolveError || !resolvedVacancy?.id) {
      return errorResponse('Vacancy not found', 'VACANCY_NOT_FOUND', {}, 404)
    }

    const { data: vacancy, error: vacancyError } = await supabase
      .from('vacancies')
      .select('id, created_by, created_by_organization, title')
      .eq('id', resolvedVacancy.id)
      .single()

    if (vacancyError || !vacancy) {
      return errorResponse('Vacancy not found', 'VACANCY_NOT_FOUND', {}, 404)
    }

    // Check if user already liked this vacancy
    const { data: existingLike, error: likeError } = await supabase
      .from('vacancy_reactions')
      .select('id')
      .eq('vacancy_id', vacancy.id)
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (likeError && likeError.code !== 'PGRST116') {
      return errorResponse('Failed to check like status', 'CHECK_LIKE_FAILED', {}, 500)
    }

    if (existingLike?.id) {
      // Remove the like
      const { error: deleteError } = await supabase
        .from('vacancy_reactions')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        return errorResponse('Failed to remove like', 'DELETE_LIKE_FAILED', {}, 500)
      }

      return successResponse({
        action: 'unliked',
        liked: false,
      })
    } else {
      // Add the like
      const { error: insertError } = await supabase
        .from('vacancy_reactions')
        .insert({
          vacancy_id: vacancy.id,
          user_id: session.user.id,
        })

      if (insertError) {
        return errorResponse('Failed to add like', 'INSERT_LIKE_FAILED', {}, 500)
      }

      // Notify organization/creator about the like (no user name exposed)
      try {
        if (vacancy.created_by_organization) {
          await NotificationService.notifyContentLiked({
            recipientOrganizationId: vacancy.created_by_organization,
            contentType: 'vacancy',
            contentId: vacancy.id,
            contentTitle: vacancy.title || 'Untitled Vacancy',
          }).catch((err) => {
            console.error('Failed to notify organization about vacancy like:', err)
          })
        } else if (vacancy.created_by && vacancy.created_by !== session.user.id) {
          await NotificationService.createNotification({
            userId: vacancy.created_by,
            type: 'vacancy_liked',
            title: 'Vakansiya bəyənildi',
            message: `Kimsə "${vacancy.title}" vakansiyasını bəyəndi`,
            actionUrl: `/resources/vacancies/${vacancy.id}`,
            data: {
              vacancyId: vacancy.id,
              vacancyTitle: vacancy.title,
            },
          }).catch((err) => {
            console.error('Failed to notify user about vacancy like:', err)
          })
        }
      } catch (notifError) {
        console.error('Error processing like notification:', notifError)
      }

      return successResponse({
        action: 'liked',
        liked: true,
      })
    }
  } catch (error) {
    console.error('POST /api/vacancies/[slug]/like error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}

// GET /api/vacancies/[slug]/like - Get like status for user
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()
    const vacancyIdentifier = params.slug

    if (!vacancyIdentifier) {
      return errorResponse('Vacancy identifier is required', 'VALIDATION_ERROR', {}, 400)
    }

    const { data: vacancy, error: vacancyError } = await resolveEntityBySlugOrId(
      supabase,
      'vacancies',
      vacancyIdentifier,
      'id'
    )

    if (vacancyError || !vacancy) {
      return errorResponse('Vacancy not found', 'VACANCY_NOT_FOUND', {}, 404)
    }

    if (!session?.user?.id) {
      return successResponse({
        liked: false,
      })
    }

    const { data: existingLike } = await supabase
      .from('vacancy_reactions')
      .select('id')
      .eq('vacancy_id', vacancy.id)
      .eq('user_id', session.user.id)
      .maybeSingle()

    return successResponse({
      liked: !!existingLike?.id,
    })
  } catch (error) {
    console.error('GET /api/vacancies/[slug]/like error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}

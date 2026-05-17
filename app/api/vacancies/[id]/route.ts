import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { isAdmin, isAdminOrOwner, isOwner } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { buildVacancyDbPayload, mapVacancyRow, validateVacancyPayload } from '@/app/api/vacancies/helpers'
import { getContentViewCounts } from '@/lib/viewTracking'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vacancyId = String(params.id || '').trim()
    const supabase = createSupabaseAdminClient()

    const { data: vacancyRow, error } = await supabase
      .from('vacancies')
      .select('*')
      .eq('id', vacancyId)
      .single()

    if (error || !vacancyRow) {
      return errorResponse('Vacancy not found', "API_ERROR", {}, 404)
    }

    const stats = await getContentViewCounts(supabase, 'vacancy', vacancyRow.id)
    const { count: savesCount } = await supabase
      .from('content_saves')
      .select('*', { count: 'exact', head: true })
      .eq('content_type', 'vacancy')
      .eq('content_id', vacancyRow.id)

    const vacancy = { 
      ...mapVacancyRow(vacancyRow),
      views: stats.views,
      uniqueViews: stats.uniqueViews,
      saves: savesCount || 0,
    }

    if (vacancy.status !== 'approved' || vacancy.isPublished === false) {
      const session = await getServerSession()
      if (!isAdminOrOwner(session, {
        created_by: vacancy.createdBy?._id ?? vacancy.createdBy,
        created_by_organization: vacancy.createdByOrganization?._id ?? vacancy.createdByOrganization,
      })) {
        return errorResponse('Unauthorized', "API_ERROR", {}, 403)
      }
    }

    return successResponse({ vacancy })
  } catch (error) {
    console.error('Error fetching vacancy:', error)
    return errorResponse('Failed to fetch vacancy', "API_ERROR", {}, 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vacancyId = String(params.id || '').trim()
    const session = await getServerSession()

    if (!session?.user?.id) {
      return errorResponse('Authentication required', "API_ERROR", {}, 401)
    }

    const supabase = createSupabaseAdminClient()

    const { data: vacancyRow, error: vacancyError } = await supabase
      .from('vacancies')
      .select('*')
      .eq('id', vacancyId)
      .single()
    if (vacancyError || !vacancyRow) {
      return errorResponse('Vacancy not found', "API_ERROR", {}, 404)
    }

    const owner = isOwner(session, vacancyRow)
    const admin = isAdmin(session)

    if (!owner && !admin) {
      return errorResponse('Permission denied', "API_ERROR", {}, 403)
    }

    const body = await request.json()

    const validation = validateVacancyPayload(body)
    if (!validation.valid) {
      return errorResponse(validation.error, "API_ERROR", {}, 400)
    }

    const updateData: any = buildVacancyDbPayload(body)

    if (!admin && owner) {
      updateData.status = 'pending'
      updateData.approved_at = null
      updateData.approved_by = null
      updateData.rejected_at = null
      updateData.rejection_reason = null
      updateData.admin_comment = null
    }

    updateData.updated_at = new Date().toISOString()

    const { data: updatedRow, error: updateError } = await supabase
      .from('vacancies')
      .update(updateData)
      .eq('id', vacancyId)
      .select('*')
      .single()

    if (updateError || !updatedRow) {
      console.error('Error updating vacancy:', updateError)
      return errorResponse('Failed to update vacancy', "API_ERROR", {}, 500)
    }

    const updatedVacancy = mapVacancyRow(updatedRow)

    return successResponse({
      message: 'Vacancy updated successfully',
      vacancy: updatedVacancy
    })
  } catch (error) {
    console.error('Error updating vacancy:', error)
    return errorResponse('Failed to update vacancy', "API_ERROR", {}, 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vacancyId = String(params.id || '').trim()
    const session = await getServerSession()

    if (!session?.user?.id) {
      return errorResponse('Authentication required', "API_ERROR", {}, 401)
    }

    const supabase = createSupabaseAdminClient()

    if (!isAdmin(session)) {
      return errorResponse('Admin access required', "API_ERROR", {}, 403)
    }

    const { data: vacancyRow, error: vacancyError } = await supabase
      .from('vacancies')
      .select('*')
      .eq('id', vacancyId)
      .single()

    if (vacancyError || !vacancyRow) {
      return errorResponse('Vacancy not found', "API_ERROR", {}, 404)
    }

    const { action, rejectionReason } = await request.json()

    if (!action || !['approve', 'reject'].includes(action)) {
      return errorResponse('Invalid action. Must be "approve" or "reject"', "API_ERROR", {}, 400)
    }

    if (action === 'reject' && !rejectionReason?.trim()) {
      return errorResponse('Rejection reason is required', "API_ERROR", {}, 400)
    }

    const updateData: any = {}
    if (action === 'approve') {
      updateData.status = 'approved'
      updateData.approved_at = new Date().toISOString()
      updateData.approved_by = session.user.id
      updateData.rejected_at = null
      updateData.rejection_reason = null
      updateData.admin_comment = null
      updateData.is_published = true
    } else if (action === 'reject') {
      updateData.status = 'rejected'
      updateData.rejected_at = new Date().toISOString()
      updateData.rejection_reason = rejectionReason.trim()
      updateData.admin_comment = rejectionReason.trim()
      updateData.approved_at = null
      updateData.approved_by = null
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from('vacancies')
      .update(updateData)
      .eq('id', vacancyId)
      .select('*')
      .single()

    if (updateError || !updatedRow) {
      console.error('Error updating vacancy status:', updateError)
      return errorResponse(updateError?.message || 'Failed to update vacancy status', "API_ERROR", {}, 500)
    }

    const notificationTitle = action === 'approve'
      ? 'Vacancy Approved!'
      : 'Vacancy Rejected'

    const notificationMessage = action === 'approve'
      ? `Your vacancy "${vacancyRow.title}" has been approved and is now live.`
      : `Your vacancy "${vacancyRow.title}" was rejected. Reason: ${rejectionReason}`

    const notificationTarget = vacancyRow.created_by_organization
      ? { organizationId: vacancyRow.created_by_organization }
      : vacancyRow.created_by
        ? { userId: vacancyRow.created_by }
        : {}
    if (Object.keys(notificationTarget).length > 0) {
      await NotificationService.createNotification({
        ...notificationTarget,
        title: notificationTitle,
        message: notificationMessage,
        type: action === 'approve' ? 'vacancy_approved' : 'vacancy_rejected',
        data: {
          relatedId: vacancyId,
          relatedModel: 'Vacancy',
          vacancyTitle: vacancyRow.title,
          action,
          ...(action === 'reject' && { rejectionReason })
        }
      })
    }

    const updatedVacancy = mapVacancyRow(updatedRow)

    return successResponse({
      message: `Vacancy ${action}d successfully`,
      vacancy: updatedVacancy
    })
  } catch (error) {
    console.error('Error updating vacancy status:', error)
    return errorResponse('Failed to update vacancy status', "API_ERROR", {}, 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vacancyId = String(params.id || '').trim()
    const session = await getServerSession()

    if (!session?.user?.id) {
      return errorResponse('Authentication required', "API_ERROR", {}, 401)
    }

    const supabase = createSupabaseAdminClient()

    const { data: vacancyRow, error: vacancyError } = await supabase
      .from('vacancies')
      .select('id, created_by, created_by_organization')
      .eq('id', vacancyId)
      .single()
    if (vacancyError || !vacancyRow) {
      return errorResponse('Vacancy not found', "API_ERROR", {}, 404)
    }

    if (!isAdminOrOwner(session, vacancyRow)) {
      return errorResponse('Permission denied', "API_ERROR", {}, 403)
    }

    const { error: deleteError } = await supabase
      .from('vacancies')
      .delete()
      .eq('id', vacancyId)

    if (deleteError) {
      return errorResponse('Failed to delete vacancy', "API_ERROR", {}, 500)
    }

    return successResponse({
      message: 'Vacancy deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting vacancy:', error)
    return errorResponse('Failed to delete vacancy', "API_ERROR", {}, 500)
  }
}
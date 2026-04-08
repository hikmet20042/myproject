import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { NotificationService } from '@/lib/services/notificationService'
import { isAdmin, isAdminOrOwner, isOwner } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'

const mapVacancy = (row: any) => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  description: row.description,
  type: row.type,
  category: row.category,
  workType: row.work_type,
  location: row.location,
  requirements: row.requirements || [],
  responsibilities: row.responsibilities || [],
  qualifications: row.qualifications || [],
  experienceLevel: row.experience_level,
  duration: row.duration,
  compensation: row.compensation,
  applicationProcess: row.application_process,
  applicationDeadline: row.application_deadline,
  startDate: row.start_date,
  skills: row.skills || [],
  languages: row.languages || [],
  tags: row.tags || [],
  imageUrl: row.image_url,
  createdBy: row.created_by
    ? { _id: row.created_by.id, name: row.created_by.name, email: row.created_by.email }
    : row.created_by,
  createdByOrganization: row.created_by_organization
    ? { _id: row.created_by_organization.id, organizationName: row.created_by_organization.organization_name, email: row.created_by_organization.email }
    : row.created_by_organization,
  status: row.status,
  approvedAt: row.approved_at,
  approvedBy: row.approved_by
    ? { _id: row.approved_by.id, name: row.approved_by.name }
    : row.approved_by,
  rejectedAt: row.rejected_at,
  rejectionReason: row.rejection_reason,
  adminComment: row.admin_comment,
  isPublished: row.is_published,
  isFeatured: row.is_featured,
  isUrgent: row.is_urgent,
  applicationCount: row.application_count,
  views: row.views,
  uniqueViews: row.unique_views,
  viewedBy: row.viewed_by || [],
  engagementScore: row.engagement_score,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// GET /api/vacancies/[id] - Get single vacancy
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    
    const { data: vacancyRow, error } = await supabase
      .from('vacancies')
      .select('*, created_by (id, name, email), created_by_organization (id, organization_name, email)')
      .eq('id', params.id)
      .single()
    
    if (error || !vacancyRow) {
      return errorResponse('Vacancy not found', "API_ERROR", {}, 404)
    }

    const vacancy = mapVacancy(vacancyRow)

    // Restrict unpublished or non-approved vacancies
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

// PUT /api/vacancies/[id] - Update vacancy
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return errorResponse('Authentication required', "API_ERROR", {}, 401)
    }
    
    const supabase = createSupabaseAdminClient()
    
    const { data: vacancyRow, error: vacancyError } = await supabase
      .from('vacancies')
      .select('*')
      .eq('id', params.id)
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

    // Validate required fields
    const requiredFields = ['title', 'description', 'type', 'location']
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return errorResponse(`${field} is required`, "API_ERROR", {}, 400)
      }
    }
    if (body.description !== undefined) {
      const descText = typeof body.description === 'string'
        ? body.description.replace(/<[^>]*>/g, '').trim()
        : ''
      if (!descText || descText.length < 50) {
        return errorResponse('Description must be at least 50 characters long', "API_ERROR", {}, 400)
      }
    }
    if (body.applicationInstructions !== undefined && typeof body.applicationInstructions === 'string') {
      const instr = body.applicationInstructions.trim()
      if (instr.length < 30) {
        return errorResponse('Application instructions must be at least 30 characters long', "API_ERROR", {}, 400)
      }
    }
    
    // Validate deadline if provided
    if (body.deadline) {
      const deadline = new Date(body.deadline)
      if (deadline <= new Date()) {
        return errorResponse('Deadline must be in the future', "API_ERROR", {}, 400)
      }
    }
    
    // Update allowed fields
    const allowedFields = [
      'title', 'description', 'type', 'location', 'requirements',
      'responsibilities', 'benefits', 'deadline', 'contactEmail',
      'contactPhone', 'applicationInstructions', 'tags'
    ]
    
    const updateData: any = {}
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    if (updateData.workType !== undefined) {
      updateData.work_type = updateData.workType
      delete updateData.workType
    }

    if (updateData.deadline !== undefined) {
      updateData.application_deadline = updateData.deadline
      delete updateData.deadline
    }

    if (updateData.applicationInstructions !== undefined) {
      updateData.application_process = {
        ...(vacancyRow.application_process || {}),
        instructions: updateData.applicationInstructions
      }
      delete updateData.applicationInstructions
    }

    if (updateData.contactEmail !== undefined) {
      updateData.application_process = {
        ...(updateData.application_process || vacancyRow.application_process || {}),
        email: updateData.contactEmail
      }
      delete updateData.contactEmail
    }

    if (updateData.contactPhone !== undefined) {
      updateData.application_process = {
        ...(updateData.application_process || vacancyRow.application_process || {}),
        contactPhone: updateData.contactPhone
      }
      delete updateData.contactPhone
    }

    if (updateData.benefits !== undefined) {
      updateData.compensation = {
        ...(vacancyRow.compensation || {}),
        benefits: updateData.benefits
      }
      delete updateData.benefits
    }
    
    // Reset approval status if content changed (except for admins)
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
      .eq('id', params.id)
      .select('*, created_by (id, name, email), created_by_organization (id, organization_name, email)')
      .single()

    if (updateError || !updatedRow) {
      return errorResponse('Failed to update vacancy', "API_ERROR", {}, 500)
    }

    const updatedVacancy = mapVacancy(updatedRow)

    return successResponse({
      message: 'Vacancy updated successfully',
      vacancy: updatedVacancy
    })
  } catch (error) {
    console.error('Error updating vacancy:', error)
    return errorResponse('Failed to update vacancy', "API_ERROR", {}, 500)
  }
}

// PATCH /api/vacancies/[id] - Approve or reject vacancy (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      .eq('id', params.id)
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
    
    // Update vacancy status
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
      .eq('id', params.id)
      .select('*, created_by (id, name, email), created_by_organization (id, organization_name, email), approved_by (id, name)')
      .single()

    if (updateError || !updatedRow) {
      return errorResponse('Failed to update vacancy status', "API_ERROR", {}, 500)
    }
    
    // Create notification for the organization
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
          relatedId: params.id,
          relatedModel: 'Vacancy',
          vacancyTitle: vacancyRow.title,
          action,
          ...(action === 'reject' && { rejectionReason })
        }
      })
    }

    const updatedVacancy = mapVacancy(updatedRow)
    
    return successResponse({
      message: `Vacancy ${action}d successfully`,
      vacancy: updatedVacancy
    })
  } catch (error) {
    console.error('Error updating vacancy status:', error)
    return errorResponse('Failed to update vacancy status', "API_ERROR", {}, 500)
  }
}

// DELETE /api/vacancies/[id] - Delete vacancy
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return errorResponse('Authentication required', "API_ERROR", {}, 401)
    }
    
    const supabase = createSupabaseAdminClient()

    const { data: vacancyRow, error: vacancyError } = await supabase
      .from('vacancies')
      .select('id, created_by, created_by_organization')
      .eq('id', params.id)
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
      .eq('id', params.id)

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

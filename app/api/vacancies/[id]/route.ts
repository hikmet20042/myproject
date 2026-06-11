import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { isAdmin, isAdminOrOwner, isOwner } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { isValidUUID } from '@/lib/utils'
import { buildVacancyDbPayload, mapVacancyRow, validateVacancyPayload } from '@/app/api/vacancies/helpers'
import { getContentViewCounts } from '@/lib/viewTracking'
import { applyRateLimit } from '@/lib/rateLimit'

const rlh = (r: Response, h: Record<string, string>) => { for (const [k,v] of Object.entries(h)) r.headers.set(k,v); return r }

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'publicRead', endpoint: '/api/vacancies/[id]' })
  try {
    if (!rlResult.allowed) {
      const r = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const vacancyId = String(params.id || '').trim()

    if (!isValidUUID(vacancyId)) {
      const r = errorResponse('Yanlış vakansiya ID-si', "API_ERROR", {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const supabase = createSupabaseAdminClient()

    const { data: vacancyRow, error } = await supabase
      .from('vacancies')
      .select('*')
      .eq('id', vacancyId)
      .single()

    if (error || !vacancyRow) {
      const r = errorResponse('Vakansiya tapılmadı', "API_ERROR", {}, 404)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    if (vacancyRow.status !== 'approved' || vacancyRow.is_published === false) {
      const session = await getServerSession()
      if (!isAdminOrOwner(session, {
        created_by: vacancyRow.created_by,
        created_by_organization: vacancyRow.created_by_organization,
      })) {
        const r = errorResponse('İcazəsiz giriş', "API_ERROR", {}, 403)
        for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
        return r
      }
    }

    const [stats, savesResult] = await Promise.all([
      getContentViewCounts(supabase, 'vacancy', vacancyRow.id),
      supabase
        .from('content_saves')
        .select('*', { count: 'exact', head: true })
        .eq('content_type', 'vacancy')
        .eq('content_id', vacancyRow.id),
    ])

    const vacancy = { 
      ...mapVacancyRow(vacancyRow),
      views: stats.views,
      uniqueViews: stats.uniqueViews,
      saves: savesResult.count || 0,
    }

    return successResponse({ vacancy })
  } catch (error) {
    console.error('Error fetching vacancy:', error)
    const r = errorResponse('Vakansiya yüklənə bilmədi', "API_ERROR", {}, 500)
    for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
    return r
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'write', endpoint: '/api/vacancies/[id]' })
  try {
    if (!rlResult.allowed) {
      const r = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const vacancyId = String(params.id || '').trim()

    if (!isValidUUID(vacancyId)) {
      const r = errorResponse('Yanlış vakansiya ID-si', "API_ERROR", {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const session = await getServerSession()

    if (!session?.user?.id) {
      const r = errorResponse('Autentifikasiya tələb olunur', "API_ERROR", {}, 401)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const supabase = createSupabaseAdminClient()

    const { data: vacancyRow, error: vacancyError } = await supabase
      .from('vacancies')
      .select('*')
      .eq('id', vacancyId)
      .single()
    if (vacancyError || !vacancyRow) {
      const r = errorResponse('Vakansiya tapılmadı', "API_ERROR", {}, 404)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const owner = isOwner(session, vacancyRow)
    const admin = isAdmin(session)

    if (!owner && !admin) {
      const r = errorResponse('İcazə rədd edildi', "API_ERROR", {}, 403)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const body = await request.json()

    const validation = validateVacancyPayload(body)
    if (!validation.valid) {
      const r = errorResponse(validation.error, "API_ERROR", {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const updateData: any = buildVacancyDbPayload(body)

    if (!admin && owner) {
      updateData.status = 'pending'
      updateData.is_published = false
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
      const r = errorResponse('Vakansiya yenilənə bilmədi', "API_ERROR", {}, 500)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const updatedVacancy = mapVacancyRow(updatedRow)

    return successResponse({ message: 'Vakansiya uğurla yeniləndi', vacancy: updatedVacancy })
  } catch (error) {
    console.error('Error updating vacancy:', error)
    const r = errorResponse('Vakansiya yenilənə bilmədi', "API_ERROR", {}, 500)
    for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
    return r
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'write', endpoint: '/api/vacancies/[id]' })
  try {
    if (!rlResult.allowed) {
      const r = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const vacancyId = String(params.id || '').trim()

    if (!isValidUUID(vacancyId)) {
      const r = errorResponse('Yanlış vakansiya ID-si', "API_ERROR", {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const session = await getServerSession()

    if (!session?.user?.id) {
      const r = errorResponse('Autentifikasiya tələb olunur', "API_ERROR", {}, 401)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const supabase = createSupabaseAdminClient()

    if (!isAdmin(session)) {
      const r = errorResponse('Admin girişi tələb olunur', "API_ERROR", {}, 403)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const { data: vacancyRow, error: vacancyError } = await supabase
      .from('vacancies')
      .select('*')
      .eq('id', vacancyId)
      .single()

    if (vacancyError || !vacancyRow) {
      const r = errorResponse('Vakansiya tapılmadı', "API_ERROR", {}, 404)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const { action, rejectionReason } = await request.json()

    if (!action || !['approve', 'reject'].includes(action)) {
      const r = errorResponse('Yanlış əməliyyat. "approve" və ya "reject" olmalıdır', "API_ERROR", {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    if (action === 'reject' && !rejectionReason?.trim()) {
      const r = errorResponse('Rədd səbəbi tələb olunur', "API_ERROR", {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
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
      const r = errorResponse(updateError?.message || 'Vakansiya statusu yenilənə bilmədi', "API_ERROR", {}, 500)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const notificationTitle = action === 'approve'
      ? 'Vakansiya təsdiqləndi!'
      : 'Vakansiya rədd edildi'

    const notificationMessage = action === 'approve'
      ? `"${vacancyRow.title}" vakansiyanız təsdiqləndi və artıq canlıdır.`
      : `"${vacancyRow.title}" vakansiyanız rədd edildi. Səbəb: ${rejectionReason}`

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

    return successResponse({ message: `Vacancy ${action}d successfully`, vacancy: updatedVacancy })
  } catch (error) {
    console.error('Error updating vacancy status:', error)
    const r = errorResponse('Vakansiya statusu yenilənə bilmədi', "API_ERROR", {}, 500)
    for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
    return r
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'write', endpoint: '/api/vacancies/[id]' })
  try {
    if (!rlResult.allowed) {
      const r = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const vacancyId = String(params.id || '').trim()

    if (!isValidUUID(vacancyId)) {
      const r = errorResponse('Yanlış vakansiya ID-si', "API_ERROR", {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const session = await getServerSession()

    if (!session?.user?.id) {
      const r = errorResponse('Autentifikasiya tələb olunur', "API_ERROR", {}, 401)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const supabase = createSupabaseAdminClient()

    const { data: vacancyRow, error: vacancyError } = await supabase
      .from('vacancies')
      .select('id, created_by, created_by_organization')
      .eq('id', vacancyId)
      .single()
    if (vacancyError || !vacancyRow) {
      const r = errorResponse('Vakansiya tapılmadı', "API_ERROR", {}, 404)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    if (!isAdminOrOwner(session, vacancyRow)) {
      const r = errorResponse('İcazə rədd edildi', "API_ERROR", {}, 403)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const { error: deleteError } = await supabase
      .from('vacancies')
      .delete()
      .eq('id', vacancyId)

    if (deleteError) {
      const r = errorResponse('Vakansiya silinə bilmədi', "API_ERROR", {}, 500)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    return successResponse({ message: 'Vakansiya uğurla silindi' })
  } catch (error) {
    console.error('Error deleting vacancy:', error)
    const r = errorResponse('Vakansiya silinə bilmədi', "API_ERROR", {}, 500)
    for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
    return r
  }
}
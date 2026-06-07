import { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canAccessAdmin } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'
import {
  applyEventLifecycleRules,
  mapEventToResponse,
  validateLifecycleState,
} from '@/app/api/events/helpers'

const hydrateEventRowWithOrganizationHandles = async (supabase: SupabaseClient, row: any) => {
  const orgId = row?.created_by_organization?.id || row?.created_by_organization
  if (!orgId) {
    return row
  }

  const { data: profile } = await supabase
    .from('organization_profiles')
    .select('account_id, organization_name, email, slug, url_handle')
    .eq('account_id', String(orgId))
    .maybeSingle()

  if (!profile) {
    return row
  }

  return {
    ...row,
    created_by_organization: {
      id: String(orgId),
      organization_name:
        profile.organization_name ||
        row?.organization_name ||
        row?.created_by_organization?.organization_name ||
        null,
      email: profile.email || row?.created_by_organization?.email || null,
      slug: profile.slug || null,
      url_handle: profile.url_handle || null,
    },
  }
}

// PATCH /api/admin/events/[id] - Admin approve/reject event
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'admin', endpoint: '/api/admin/events/[id]' })
    if (!rlResult.allowed) {
      const r = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const supabase = createSupabaseAdminClient()
    
    const session = await getServerSession()
    
    if (!session || !canAccessAdmin(session)) {
      return errorResponse('Admin girişi tələb olunur', 'ADMIN_ACCESS_REQUIRED', {}, 403)
    }

    const body = await request.json()
    const { action, adminComment, rejectionReason } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return errorResponse('Yanlış əməliyyat. "approve" və ya "reject" olmalıdır', 'INVALID_ACTION', {}, 400)
    }
    if (action === 'reject' && (!rejectionReason || !String(rejectionReason).trim())) {
      return errorResponse('Rədd əməliyyatı üçün rejectionReason tələb olunur', 'VALIDATION_ERROR', {}, 400)
    }

    const { data: eventRow, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (eventError || !eventRow) {
      return errorResponse('Tədbir tapılmadı', 'EVENT_NOT_FOUND', {}, 404)
    }

    const lifecycleState = validateLifecycleState(eventRow)
    if (!lifecycleState.valid) {
      return errorResponse(lifecycleState.error || 'Yanlış dövr vəziyyəti', 'INVALID_LIFECYCLE_STATE', {}, 409)
    }

    const lifecycleResult = applyEventLifecycleRules(
      eventRow,
      action === 'approve' ? 'approve' : 'reject',
      {
        role: 'admin',
        id: session.user.id,
        rejectionReason,
        adminComment,
      }
    )
    if (!lifecycleResult.ok) {
      return errorResponse(lifecycleResult.error || 'Yanlış dövr keçidi', 'INVALID_LIFECYCLE_TRANSITION', {}, 409)
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from('events')
      .update({ ...lifecycleResult.updateData, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select('*, created_by (id, name, email), created_by_organization (id, organization_name, email), approved_by (id, name)')
      .single()

    if (updateError || !updatedRow) {
      return errorResponse('Tədbir yenilənə bilmədi', 'UPDATE_EVENT_FAILED', {}, 500)
    }

    const hydratedUpdatedRow = await hydrateEventRowWithOrganizationHandles(supabase, updatedRow)
    const updatedEvent = mapEventToResponse(hydratedUpdatedRow)

    return successResponse(
      { event: updatedEvent },
      { message: `Event ${action}d successfully` }
    )
  } catch (error) {
    console.error('Error processing event action:', error)
    return errorResponse('Daxili server xətası', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}

// GET /api/admin/events/[id] - Admin get event details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'admin', endpoint: '/api/admin/events/[id]' })
    if (!rlResult.allowed) {
      const r = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const supabase = createSupabaseAdminClient()
    
    const session = await getServerSession()
    
    if (!session || !canAccessAdmin(session)) {
      return errorResponse('Admin girişi tələb olunur', 'ADMIN_ACCESS_REQUIRED', {}, 403)
    }

    const { data: eventRow, error: eventError } = await supabase
      .from('events')
      .select('*, created_by (id, name, email), created_by_organization (id, organization_name, email), approved_by (id, name)')
      .eq('id', params.id)
      .single()
    
    if (eventError || !eventRow) {
      return errorResponse('Tədbir tapılmadı', 'EVENT_NOT_FOUND', {}, 404)
    }
    
    const hydratedEventRow = await hydrateEventRowWithOrganizationHandles(supabase, eventRow)
    return successResponse({ event: mapEventToResponse(hydratedEventRow) })
  } catch (error) {
    console.error('Error fetching event for admin:', error)
    return errorResponse('Tədbir yüklənə bilmədi', 'FETCH_EVENT_FAILED', {}, 500)
  }
}

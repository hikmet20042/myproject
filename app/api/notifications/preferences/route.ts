import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { handleApiRequest, withRateLimitHeaders } from '@/lib/apiHelpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const result = await handleApiRequest(request, {
      rateLimit: 'authenticatedRead',
      requireAuth: true,
      endpoint: '/api/notifications/preferences',
    })
    if (result instanceof Response) return result

    const { session, rateLimitHeaders } = result
    const supabase = createSupabaseAdminClient()

    const isOrg = isApprovedOrganization(session!)
    const column = isOrg ? 'organization_id' : 'user_id'
    
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq(column, session!.user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return withRateLimitHeaders(errorResponse('Tərcihlər yüklənə bilmədi', 'API_ERROR', {}, 500), rateLimitHeaders)
    }

    return withRateLimitHeaders(
      successResponse(preferences || {
        user_id: isOrg ? null : session!.user.id,
        organization_id: isOrg ? session!.user.id : null,
        engagement_enabled: true,
        frequency: 'instant',
      }),
      rateLimitHeaders
    )
  } catch (error) {
    console.error('Notification preferences fetch error:', error)
    return errorResponse('Daxili server xətası', 'API_ERROR', {}, 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const result = await handleApiRequest(request, {
      rateLimit: 'write',
      requireAuth: true,
      endpoint: '/api/notifications/preferences',
    })
    if (result instanceof Response) return result

    const { session, rateLimitHeaders } = result
    const supabase = createSupabaseAdminClient()

    const body = await request.json()
    
    const validKeys = ['engagement_enabled', 'frequency']
    const invalidKeys = Object.keys(body).filter((key) => !validKeys.includes(key))
    if (invalidKeys.length > 0) {
      return withRateLimitHeaders(errorResponse(`Invalid preference keys: ${invalidKeys.join(', ')}`, 'API_ERROR', {}, 400), rateLimitHeaders)
    }

    const isOrg = isApprovedOrganization(session!)
    const column = isOrg ? 'organization_id' : 'user_id'
    
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq(column, session!.user.id)
      .single()

    let data, error
    
    if (existing) {
      ({ data, error } = await supabase
        .from('notification_preferences')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq(column, session!.user.id)
        .select('*')
        .single())
    } else {
      ({ data, error } = await supabase
        .from('notification_preferences')
        .insert({ [column]: session!.user.id, ...body })
        .select('*')
        .single())
    }

    if (error || !data) {
      return withRateLimitHeaders(errorResponse('Tərcihlər yenilənə bilmədi', 'API_ERROR', {}, 500), rateLimitHeaders)
    }

    return withRateLimitHeaders(successResponse({ message: 'Bildiriş tərcihləri uğurla yeniləndi', preferences: data }), rateLimitHeaders)
  } catch (error) {
    console.error('Notification preferences update error:', error)
    return errorResponse('Daxili server xətası', 'API_ERROR', {}, 500)
  }
}

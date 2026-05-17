import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'authenticatedRead',
      endpoint: '/api/notifications/preferences',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      const response = errorResponse('Unauthorized', 'API_ERROR', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const isOrg = isApprovedOrganization(session)
    const column = isOrg ? 'organization_id' : 'user_id'
    
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq(column, session.user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      const response = errorResponse('Failed to fetch preferences', 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const response = successResponse(
      preferences || {
        user_id: isOrg ? null : session.user.id,
        organization_id: isOrg ? session.user.id : null,
        engagement_enabled: true,
        frequency: 'instant',
      }
    )
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response
  } catch (error) {
    console.error('Notification preferences fetch error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'write',
      endpoint: '/api/notifications/preferences',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      const response = errorResponse('Unauthorized', 'API_ERROR', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const body = await request.json()
    
    const validKeys = ['engagement_enabled', 'frequency']
    const invalidKeys = Object.keys(body).filter((key) => !validKeys.includes(key))
    if (invalidKeys.length > 0) {
      const response = errorResponse(`Invalid preference keys: ${invalidKeys.join(', ')}`, 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const isOrg = isApprovedOrganization(session)
    const column = isOrg ? 'organization_id' : 'user_id'
    
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq(column, session.user.id)
      .single()

    let data, error
    
    if (existing) {
      ({ data, error } = await supabase
        .from('notification_preferences')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq(column, session.user.id)
        .select('*')
        .single())
    } else {
      ({ data, error } = await supabase
        .from('notification_preferences')
        .insert({ [column]: session.user.id, ...body })
        .select('*')
        .single())
    }

    if (error || !data) {
      const response = errorResponse('Failed to update preferences', 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const response = successResponse({ message: 'Notification preferences updated successfully', preferences: data })
    for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
    return response
  } catch (error) {
    console.error('Notification preferences update error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}

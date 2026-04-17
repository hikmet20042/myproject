import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isApprovedOrganization } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 'API_ERROR', {}, 401)
    }

    // Determine which column to query based on account type
    const isOrg = isApprovedOrganization(session)
    const column = isOrg ? 'organization_id' : 'user_id'
    
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq(column, session.user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows found" which is fine
      console.error('Error fetching preferences:', error)
      return errorResponse('Failed to fetch preferences', 'API_ERROR', {}, 500)
    }

    // Return preferences if found, otherwise return defaults
    return successResponse(
      preferences || {
        user_id: isOrg ? null : session.user.id,
        organization_id: isOrg ? session.user.id : null,
        engagement_enabled: true,
        frequency: 'instant',
      }
    )
  } catch (error) {
    console.error('Notification preferences fetch error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 'API_ERROR', {}, 401)
    }

    const body = await request.json()
    
    // Validate that body only contains known preference keys
    const validKeys = [
      'engagement_enabled',
      'frequency',
    ]

    const invalidKeys = Object.keys(body).filter((key) => !validKeys.includes(key))
    if (invalidKeys.length > 0) {
      return errorResponse(
        `Invalid preference keys: ${invalidKeys.join(', ')}`,
        'API_ERROR',
        {},
        400
      )
    }

    // Determine which column to query based on account type
    const isOrg = isApprovedOrganization(session)
    const column = isOrg ? 'organization_id' : 'user_id'
    
    // Try to update existing preferences
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq(column, session.user.id)
      .single()

    let data, error
    
    if (existing) {
      // Update existing preferences
      ({ data, error } = await supabase
        .from('notification_preferences')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq(column, session.user.id)
        .select('*')
        .single())
    } else {
      // Create new preferences
      ({ data, error } = await supabase
        .from('notification_preferences')
        .insert({
          [column]: session.user.id,
          ...body,
        })
        .select('*')
        .single())
    }

    if (error || !data) {
      console.error('Error updating preferences:', error)
      return errorResponse('Failed to update preferences', 'API_ERROR', {}, 500)
    }

    return successResponse({
      message: 'Notification preferences updated successfully',
      preferences: data,
    })
  } catch (error) {
    console.error('Notification preferences update error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}

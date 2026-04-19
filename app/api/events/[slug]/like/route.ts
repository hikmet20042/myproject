import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

export const dynamic = 'force-dynamic'

// POST /api/events/[slug]/like - Toggle like reaction on an event
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

    const eventIdentifier = params.slug

    if (!eventIdentifier) {
      return errorResponse('Event identifier is required', 'VALIDATION_ERROR', {}, 400)
    }

    const { data: resolvedEvent, error: resolveError } = await resolveEntityBySlugOrId(
      supabase,
      'events',
      eventIdentifier,
      'id'
    )

    if (resolveError || !resolvedEvent?.id) {
      return errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404)
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, created_by, created_by_organization, title')
      .eq('id', resolvedEvent.id)
      .single()

    if (eventError || !event) {
      return errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404)
    }

    // Check if user already liked this event
    const { data: existingLike, error: likeError } = await supabase
      .from('event_reactions')
      .select('id')
      .eq('event_id', event.id)
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (likeError && likeError.code !== 'PGRST116') {
      return errorResponse('Failed to check like status', 'CHECK_LIKE_FAILED', {}, 500)
    }

    if (existingLike?.id) {
      // Remove the like
      const { error: deleteError } = await supabase
        .from('event_reactions')
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
        .from('event_reactions')
        .insert({
          event_id: event.id,
          user_id: session.user.id,
        })

      if (insertError) {
        return errorResponse('Failed to add like', 'INSERT_LIKE_FAILED', {}, 500)
      }

      return successResponse({
        action: 'liked',
        liked: true,
      })
    }
  } catch (error) {
    console.error('POST /api/events/[slug]/like error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}

// GET /api/events/[slug]/like - Get like status for user
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()
    const eventIdentifier = params.slug

    if (!eventIdentifier) {
      return errorResponse('Event identifier is required', 'VALIDATION_ERROR', {}, 400)
    }

    const { data: event, error: eventError } = await resolveEntityBySlugOrId(
      supabase,
      'events',
      eventIdentifier,
      'id'
    )

    if (eventError || !event) {
      return errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404)
    }

    if (!session?.user?.id) {
      return successResponse({
        liked: false,
      })
    }

    const { data: existingLike } = await supabase
      .from('event_reactions')
      .select('id')
      .eq('event_id', event.id)
      .eq('user_id', session.user.id)
      .maybeSingle()

    return successResponse({
      liked: !!existingLike?.id,
    })
  } catch (error) {
    console.error('GET /api/events/[slug]/like error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}

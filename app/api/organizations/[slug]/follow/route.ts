import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

export const dynamic = 'force-dynamic'

const getFollowerCount = async (organizationId: string) => {
  const supabase = createSupabaseAdminClient()
  const { count } = await supabase
    .from('organization_followers')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
  return count || 0
}

const resolveOrganizationAccountId = async (identifier: string) => {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await resolveEntityBySlugOrId(
    supabase,
    'organization_profiles',
    identifier,
    'account_id'
  )

  if (error || !data?.account_id) {
    return null
  }

  return data.account_id as string
}

const ensurePublicOrganizationExists = async (identifier: string) => {
  const supabase = createSupabaseAdminClient()
  const organizationId = await resolveOrganizationAccountId(identifier)
  if (!organizationId) return false

  const { data } = await supabase
    .from('organization_profiles')
    .select('account_id, moderation_status')
    .eq('account_id', organizationId)
    .maybeSingle()

  if (!data || data.moderation_status !== 'approved') {
    return false
  }

  return true
}

const getOrganizationName = async (identifier: string) => {
  const supabase = createSupabaseAdminClient()
  const organizationId = await resolveOrganizationAccountId(identifier)
  if (!organizationId) return null

  const { data } = await supabase
    .from('organization_profiles')
    .select('organization_name')
    .eq('account_id', organizationId)
    .maybeSingle()

  return data?.organization_name || null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const identifier = params.slug
    const exists = await ensurePublicOrganizationExists(identifier)
    if (!exists) {
      return errorResponse('Organization not found', "API_ERROR", {}, 404)
    }

    const organizationId = await resolveOrganizationAccountId(identifier)
    if (!organizationId) {
      return errorResponse('Organization not found', "API_ERROR", {}, 404)
    }

    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()
    const followerCount = await getFollowerCount(organizationId)
    let isFollowing = false

    if (session?.user?.id) {
      const { data: followRow } = await supabase
        .from('organization_followers')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', session.user.id)
        .maybeSingle()
      isFollowing = Boolean(followRow)
    }

    return successResponse({
      organizationId,
      isFollowing,
      followerCount,
    })
  } catch (error) {
    console.error('Failed to fetch follow state:', error)
    return errorResponse('Failed to fetch follow state', "API_ERROR", {}, 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return errorResponse('Authentication required', "API_ERROR", {}, 401)
    }

    if (session.user.accountType === 'organization') {
      return errorResponse('Organization accounts cannot follow organizations', "API_ERROR", {}, 403)
    }

    const identifier = params.slug
    const exists = await ensurePublicOrganizationExists(identifier)
    if (!exists) {
      return errorResponse('Organization not found', "API_ERROR", {}, 404)
    }

    const supabase = createSupabaseAdminClient()

    const organizationId = await resolveOrganizationAccountId(identifier)
    if (!organizationId) {
      return errorResponse('Organization not found', "API_ERROR", {}, 404)
    }

    const body = await request.json().catch(() => ({}))
    const requestedAction = body?.action === 'follow' || body?.action === 'unfollow' ? body.action : 'toggle'

    const { data: existingFollow } = await supabase
      .from('organization_followers')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', session.user.id)
      .maybeSingle()

    const shouldFollow = requestedAction === 'follow' || (requestedAction === 'toggle' && !existingFollow)

    if (shouldFollow) {
      await supabase
        .from('organization_followers')
        .upsert(
          {
            organization_id: organizationId,
            user_id: session.user.id,
          },
          { onConflict: 'organization_id,user_id', ignoreDuplicates: true }
        )
    } else {
      await supabase
        .from('organization_followers')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', session.user.id)
    }

    const followerCount = await getFollowerCount(organizationId)

    // Notify organization owner account about follow state changes
    try {
      const organizationName = await getOrganizationName(identifier)
      await NotificationService.notifyOrganizationFollow({
        organizationId,
        organizationName,
        followerId: session.user.id,
        followerName: session.user.name,
        action: shouldFollow ? 'follow' : 'unfollow',
      })
    } catch (notificationError) {
      console.error('Failed to notify organization follow change:', notificationError)
    }

    return successResponse({
      organizationId,
      isFollowing: shouldFollow,
      followerCount,
    })
  } catch (error) {
    console.error('Failed to update follow state:', error)
    return errorResponse('Failed to update follow state', "API_ERROR", {}, 500)
  }
}

import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { applyRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const getFollowerCount = async (organizationId: string) => {
  const supabase = createSupabaseAdminClient()
  const { count } = await supabase
    .from('organization_followers')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
  return count || 0
}

const getOrganizationName = async (accountId: string) => {
  const supabase = createSupabaseAdminClient()
  const { data } = await supabase
    .from('organization_profiles')
    .select('organization_name')
    .eq('account_id', accountId)
    .maybeSingle()

  return data?.organization_name || null
}

// GET /api/organizations/[id]/follow - Get follow state by account_id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'publicRead', endpoint: '/api/organizations/[id]/follow' })
    if (!rlResult.allowed) {
      const r = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const supabase = createSupabaseAdminClient()

    const { data: profile } = await supabase
      .from('organization_profiles')
      .select('account_id, moderation_status')
      .eq('account_id', params.id)
      .maybeSingle()

    if (!profile || profile.moderation_status !== 'approved') {
      const r = errorResponse('Organization not found', "API_ERROR", {}, 404)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const session = await getServerSession()
    const followerCount = await getFollowerCount(profile.account_id)
    let isFollowing = false

    if (session?.user?.id) {
      const { data: followRow } = await supabase
        .from('organization_followers')
        .select('id')
        .eq('organization_id', profile.account_id)
        .eq('user_id', session.user.id)
        .maybeSingle()
      isFollowing = Boolean(followRow)
    }

    const r = successResponse({
      organizationId: profile.account_id,
      isFollowing,
      followerCount,
    })
    for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
    return r
  } catch (error) {
    console.error('Failed to fetch follow state:', error)
    return errorResponse('Failed to fetch follow state', "API_ERROR", {}, 500)
  }
}

// POST /api/organizations/[id]/follow - Toggle follow by account_id
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { result: rlResult, headers: rlHeaders } = applyRateLimit({ request, preset: 'write', endpoint: '/api/organizations/[id]/follow' })
    if (!rlResult.allowed) {
      const r = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const session = await getServerSession()
    if (!session?.user?.id) {
      const r = errorResponse('Authentication required', "API_ERROR", {}, 401)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    if (session.user.accountType === 'organization') {
      const r = errorResponse('Organization accounts cannot follow organizations', "API_ERROR", {}, 403)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const supabase = createSupabaseAdminClient()

    const { data: profile } = await supabase
      .from('organization_profiles')
      .select('account_id, moderation_status, organization_name')
      .eq('account_id', params.id)
      .maybeSingle()

    if (!profile || profile.moderation_status !== 'approved') {
      const r = errorResponse('Organization not found', "API_ERROR", {}, 404)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const body = await request.json().catch(() => ({}))
    const requestedAction = body?.action === 'follow' || body?.action === 'unfollow' ? body.action : 'toggle'

    const { data: existingFollow } = await supabase
      .from('organization_followers')
      .select('id')
      .eq('organization_id', profile.account_id)
      .eq('user_id', session.user.id)
      .maybeSingle()

    const shouldFollow = requestedAction === 'follow' || (requestedAction === 'toggle' && !existingFollow)

    if (shouldFollow) {
      await supabase
        .from('organization_followers')
        .upsert(
          {
            organization_id: profile.account_id,
            user_id: session.user.id,
          },
          { onConflict: 'organization_id,user_id', ignoreDuplicates: true }
        )
    } else {
      await supabase
        .from('organization_followers')
        .delete()
        .eq('organization_id', profile.account_id)
        .eq('user_id', session.user.id)
    }

    const followerCount = await getFollowerCount(profile.account_id)

    try {
      await NotificationService.notifyOrganizationFollow({
        organizationId: profile.account_id,
        organizationName: profile.organization_name,
        followerId: session.user.id,
        followerName: session.user.name,
        action: shouldFollow ? 'follow' : 'unfollow',
      })
    } catch (notificationError) {
      console.error('Failed to notify organization follow change:', notificationError)
    }

    const r = successResponse({
      organizationId: profile.account_id,
      isFollowing: shouldFollow,
      followerCount,
    })
    for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
    return r
  } catch (error) {
    console.error('Failed to update follow state:', error)
    return errorResponse('Failed to update follow state', "API_ERROR", {}, 500)
  }
}

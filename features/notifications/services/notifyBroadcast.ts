import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { emitNotificationToUser } from '@/lib/socket'
import { sendNotificationToUser as sendSSENotification } from '@/lib/sse'
import { createNotification } from './core'

const DEBUG_NOTIFICATIONS = process.env.NEXT_PUBLIC_DEBUG_NOTIFICATIONS === 'true'

export async function notifyOrganizationFollowersAboutNewContent(params: {
  organizationId: string
  organizationName: string
  contentType: 'vacancy'
  contentId: string
  contentSlug?: string
  contentTitle: string
}) {
  try {
    const supabase = createSupabaseAdminClient()
    const { data: followers } = await supabase
      .from('organization_followers')
      .select('user_id')
      .eq('organization_id', params.organizationId)

    const followerIds = (followers || []).map((row) => row.user_id).filter(Boolean)

    if (followerIds.length === 0) {
      return
    }

    const type = 'organization_new_vacancy'
    const title = 'İzlənilən Təşkilatdan Yeni Vakansiya'
    const message = `${params.organizationName} təşkilatı yeni vakansiya paylaşdı: "${params.contentTitle}"`
    const routeKey = params.contentSlug || params.contentId
    const actionUrl = `/resources/vacancies/${routeKey}`

    await Promise.all(
      followerIds.map((userId) =>
        createNotification({
          userId,
          type,
          title,
          message,
          actionUrl,
          data: {
            organizationId: params.organizationId,
            organizationName: params.organizationName,
            contentType: params.contentType,
            contentId: params.contentId,
            contentSlug: params.contentSlug,
            contentTitle: params.contentTitle,
          },
        }).catch((err) => {
          if (DEBUG_NOTIFICATIONS) console.error(`Failed to notify follower ${userId}:`, err)
        }),
      ),
    )
  } catch (error) {
    if (DEBUG_NOTIFICATIONS) console.error('Error notifying organization followers:', error)
  }
}

export async function notifyUsersAboutRelevantItem(params: {
  itemType: 'event' | 'vacancy' | 'blog'
  itemId: string
  title: string
  description?: string
  tags?: string[]
  actionUrl: string
}) {
  try {
    const supabase = createSupabaseAdminClient()
    const haystack = `${params.title} ${params.description || ''} ${(params.tags || []).join(' ')}`.toLowerCase()

    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, interests')

    if (profileError || !profiles?.length) return

    const interestedUserIds = profiles
      .filter((profile: any) => {
        const interests = Array.isArray(profile.interests)
          ? profile.interests.map((i: string) => i.toLowerCase())
          : []
        if (interests.length === 0) return false
        return interests.some((interest: string) => haystack.includes(interest))
      })
      .map((profile: any) => profile.user_id)
      .filter(Boolean)

    if (interestedUserIds.length === 0) return

    const { data: existingRows } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('type', 'NEW_RELEVANT_ITEM')
      .eq('related_item_id', params.itemId)
      .eq('related_item_type', params.itemType)
      .in('user_id', interestedUserIds)

    const existingUserSet = new Set((existingRows || []).map((row: any) => row.user_id))
    const targetUserIds = interestedUserIds.filter(
      (id: string) => !existingUserSet.has(id),
    )
    if (targetUserIds.length === 0) return

    const payload = targetUserIds.map((userId: string) => ({
      user_id: userId,
      type: 'NEW_RELEVANT_ITEM',
      title: 'Sənin maraqlarına uyğun yeni imkan var',
      message: params.title,
      action_url: params.actionUrl,
      data: {
        itemId: params.itemId,
        itemType: params.itemType,
        title: params.title,
      },
      related_item_id: params.itemId,
      related_item_type: params.itemType,
      is_read: false,
    }))

    const { data: createdNotifications } = await supabase
      .from('notifications')
      .insert(payload)
      .select('*')

    const rows = createdNotifications || []
    const shouldAttemptSSE =
      process.env.NEXT_PUBLIC_SSE_ENABLED === 'true' &&
      process.env.NEXT_PUBLIC_SOCKET_ENABLED !== 'true'

    for (const row of rows) {
      emitNotificationToUser(row.user_id, {
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        actionUrl: row.action_url,
        data: row.data,
        isRead: row.is_read,
        createdAt: row.created_at,
      })

      if (shouldAttemptSSE) {
        await sendSSENotification(row.user_id, {
          id: row.id,
          type: row.type,
          title: row.title,
          message: row.message,
          actionUrl: row.action_url,
          data: row.data,
          isRead: row.is_read,
          createdAt: row.created_at,
        })
      }
    }
  } catch (error) {
    if (DEBUG_NOTIFICATIONS) console.error('Error notifying relevant users:', error)
  }
}

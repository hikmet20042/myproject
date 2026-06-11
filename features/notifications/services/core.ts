import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { emitNotificationToUser } from '@/lib/socket'
import { sendNotificationToUser as sendSSENotification } from '@/lib/sse'

const DEBUG_NOTIFICATIONS = process.env.NEXT_PUBLIC_DEBUG_NOTIFICATIONS === 'true'

const ALLOWED_NOTIFICATION_TYPES = new Set([
  'blog_approved',
  'blog_rejected',
  'blog_like',
  'blog_saved',
  'event_deadline',
  'vacancy_approved',
  'vacancy_rejected',
  'vacancy_deadline',
  'vacancy_like',
  'vacancy_saved',
  'organization_followed',
  'organization_unfollowed',
  'organization_new_vacancy',
  'content_view_milestone',
  'email_confirmed',
  'email_change_initiated',
  'password_changed',
  'admin_action_required',
  'welcome',
  'NEW_RELEVANT_ITEM',
])

function sanitizeInput(input: string | undefined | null): string {
  if (!input) return ''
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .slice(0, 500)
}

function validateActionUrl(url: string | undefined | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url, 'https://icma360.com')
    const hostname = parsed.hostname.toLowerCase()
    if (
      hostname === 'icma360.com' ||
      hostname === 'www.icma360.com' ||
      hostname.endsWith('.icma360.com')
    ) {
      return url
    }
    return null
  } catch {
    if (url.startsWith('/') || url.startsWith('#')) {
      return url
    }
    return null
  }
}

function validateNotificationType(type: string): boolean {
  return ALLOWED_NOTIFICATION_TYPES.has(type)
}

const GROUPABLE_NOTIFICATION_TYPES = new Set([
  'blog_like',
  'blog_saved',
  'vacancy_like',
  'vacancy_saved',
  'organization_followed',
])

const GROUPING_WINDOW_MS = 3600000

async function checkAndGroupNotification(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  recipientColumn: string,
  recipientId: string,
  type: string,
): Promise<{ shouldCreate: boolean; groupedNotificationId?: string; count?: number }> {
  if (!GROUPABLE_NOTIFICATION_TYPES.has(type)) {
    return { shouldCreate: true }
  }

  const oneHourAgo = new Date(Date.now() - GROUPING_WINDOW_MS).toISOString()

  const { data: existing, error } = await supabase
    .from('notifications')
    .select('id, data')
    .eq(recipientColumn, recipientId)
    .eq('type', type)
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !existing) {
    return { shouldCreate: true }
  }

  const existingData = (existing.data as any) || {}
  const newCount = (existingData.groupCount || 1) + 1

  const { error: updateError } = await supabase
    .from('notifications')
    .update({
      message: existingData.groupMessage,
      data: {
        ...existingData,
        groupCount: newCount,
        lastUpdated: new Date().toISOString(),
      },
    })
    .eq('id', existing.id)

  if (updateError) {
    console.error('Failed to update grouped notification:', updateError)
    return { shouldCreate: true }
  }

  return {
    shouldCreate: false,
    groupedNotificationId: existing.id,
    count: newCount,
  }
}

interface CreateNotificationParams {
  userId?: string
  organizationId?: string
  type: string
  title: string
  message: string
  actionUrl?: string
  data?: Record<string, any>
  relatedItemId?: string
  relatedItemType?: 'event' | 'vacancy' | 'blog'
}

function isEssentialNotification(notificationType: string): boolean {
  const essentialTypes = [
    'email_confirmed',
    'email_change_initiated',
    'password_changed',
    'blog_approved',
    'blog_rejected',
    'vacancy_approved',
    'vacancy_rejected',
    'admin_action_required',
    'welcome',
  ]
  return essentialTypes.includes(notificationType)
}

async function isNotificationEnabled(
  userId: string | undefined,
  organizationId: string | undefined,
  notificationType: string,
): Promise<boolean> {
  try {
    if (isEssentialNotification(notificationType)) {
      return true
    }

    const supabase = createSupabaseAdminClient()

    const column = userId ? 'user_id' : 'organization_id'
    const id = userId || organizationId

    if (!id) return true

    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('engagement_enabled, frequency')
      .eq(column, id)
      .single()

    if (error || !preferences) {
      if (DEBUG_NOTIFICATIONS) {
        console.debug(`Preferences not found for ${column}:${id}, defaulting to enabled`)
      }
      return true
    }

    if (preferences.frequency === 'off') {
      return false
    }

    if (preferences.engagement_enabled === false) {
      return false
    }

    return true
  } catch (error) {
    if (DEBUG_NOTIFICATIONS) console.error('Error checking notification preferences:', error)
    return true
  }
}

async function isWithinRateLimit(
  userId: string | undefined,
  organizationId: string | undefined,
): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient()

    const recipientColumn = userId ? 'user_id' : 'organization_id'
    const recipientId = userId || organizationId

    if (!recipientId) return true

    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq(recipientColumn, recipientId)
      .gte('created_at', oneMinuteAgo)

    if (error) {
      if (DEBUG_NOTIFICATIONS) console.error('Error checking rate limit:', error)
      return true
    }

    const notificationCount = count || 0
    const withinLimit = notificationCount < 100

    if (!withinLimit && DEBUG_NOTIFICATIONS) {
      console.warn(
        `Rate limit exceeded for ${userId ? 'user' : 'organization'}: ${recipientId}. Count: ${notificationCount}`,
      )
    }

    return withinLimit
  } catch (error) {
    if (DEBUG_NOTIFICATIONS) console.error('Error checking rate limit:', error)
    return true
  }
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    if (!params.userId && !params.organizationId) {
      throw new Error('Either userId or organizationId is required to create a notification')
    }

    if (!validateNotificationType(params.type)) {
      if (DEBUG_NOTIFICATIONS) console.warn(`Invalid notification type: ${params.type}`)
      throw new Error('Invalid notification type')
    }

    const sanitizedTitle = sanitizeInput(params.title)
    const sanitizedMessage = sanitizeInput(params.message)
    const validatedActionUrl = validateActionUrl(params.actionUrl)

    if (!sanitizedTitle || !sanitizedMessage) {
      throw new Error('Title and message are required')
    }

    const withinLimit = await isWithinRateLimit(params.userId, params.organizationId)

    if (!withinLimit) {
      if (DEBUG_NOTIFICATIONS) {
        console.debug(
          `Notification rate limit exceeded for ${params.userId ? 'user' : 'organization'}: ${params.userId || params.organizationId}`,
        )
      }
      return null
    }

    const isEnabled = await isNotificationEnabled(
      params.userId,
      params.organizationId,
      params.type,
    )

    if (!isEnabled) {
      if (DEBUG_NOTIFICATIONS) {
        console.debug(
          `Notification type "${params.type}" is disabled for ${params.userId ? 'user' : 'organization'}: ${params.userId || params.organizationId}`,
        )
      }
      return null
    }

    const supabase = createSupabaseAdminClient()

    const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString()
    const recipientColumn = params.userId ? 'user_id' : 'organization_id'
    const recipientId = params.userId || params.organizationId
    if (!recipientId) {
      return null
    }

    const { data: recentDuplicate } = await supabase
      .from('notifications')
      .select('id')
      .eq(recipientColumn, recipientId)
      .eq('type', params.type)
      .eq('message', sanitizedMessage)
      .gte('created_at', sixtySecondsAgo)
      .limit(1)
      .single()

    if (recentDuplicate) {
      if (DEBUG_NOTIFICATIONS) {
        console.debug(
          `Duplicate notification prevented for ${params.userId ? 'user' : 'organization'}: ${recipientId}, type: ${params.type}`,
        )
      }
      return null
    }

    const groupingResult = await checkAndGroupNotification(
      supabase,
      recipientColumn,
      recipientId,
      params.type,
    )

    if (!groupingResult.shouldCreate) {
      if (DEBUG_NOTIFICATIONS) {
        console.debug(
          `Notification grouped for ${recipientId}, type: ${params.type}, new count: ${groupingResult.count}`,
        )
      }
      emitNotificationToUser(recipientId, {
        id: groupingResult.groupedNotificationId!,
        type: params.type,
        title: sanitizedTitle,
        message:
          groupingResult.count! > 2
            ? `${groupingResult.count} yeni bildiriş`
            : sanitizedMessage,
        data: { groupCount: groupingResult.count, grouped: true },
        isRead: false,
        createdAt: new Date().toISOString(),
      })
      return null
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId || null,
        organization_id: params.organizationId || null,
        type: params.type,
        title: sanitizedTitle,
        message: sanitizedMessage,
        action_url: validatedActionUrl,
        data: GROUPABLE_NOTIFICATION_TYPES.has(params.type)
          ? { ...params.data, groupMessage: sanitizedMessage, groupCount: 1 }
          : params.data || {},
        is_read: false,
      })
      .select('*')
      .single()

    if (error || !notification) {
      throw error || new Error('Failed to create notification')
    }

    const recipientIdForEmit = params.userId || params.organizationId || null

    if (recipientIdForEmit) {
      emitNotificationToUser(recipientIdForEmit, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.action_url,
        data: notification.data,
        isRead: notification.is_read,
        createdAt: notification.created_at,
      })
    }

    const shouldAttemptSSE =
      process.env.NEXT_PUBLIC_SSE_ENABLED === 'true' &&
      process.env.NEXT_PUBLIC_SOCKET_ENABLED !== 'true'

    if (shouldAttemptSSE) {
      try {
        if (recipientIdForEmit) {
          await sendSSENotification(recipientIdForEmit, {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            actionUrl: notification.action_url,
            data: notification.data,
            isRead: notification.is_read,
            createdAt: notification.created_at,
          })
        }
      } catch (err: any) {
        if (DEBUG_NOTIFICATIONS) {
          console.debug('SSE sendNotificationToUser failed or no connection:', err?.message || err)
        }
      }
    }

    return notification
  } catch (error) {
    if (DEBUG_NOTIFICATIONS) console.error('Error creating notification:', error)
    throw error
  }
}



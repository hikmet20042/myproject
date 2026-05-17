import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { emitNotificationToUser } from '@/lib/socket'
import { sendNotificationToUser as sendSSENotification } from '@/lib/sse'

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

const GROUPING_WINDOW_MS = 3600000 // 1 hour

async function checkAndGroupNotification(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  recipientColumn: string,
  recipientId: string,
  type: string
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

  await supabase
    .from('notifications')
    .update({
      message: existingData.groupMessage,
      data: {
        ...existingData,
        groupCount: newCount,
        lastUpdated: new Date().toISOString()
      }
    })
    .eq('id', existing.id)

  return {
    shouldCreate: false,
    groupedNotificationId: existing.id,
    count: newCount
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

/**
 * Centralized notification creation service with real-time Socket.IO support
 */
export class NotificationService {
  /**
   * Check if notification is in the essential category
   */
  private static isEssentialNotification(notificationType: string): boolean {
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

  /**
   * Check if user/organization has enabled notifications for a specific type
   * Modern simplified system:
   * - ESSENTIAL: Account security & content moderation (always on)
   * - ENGAGEMENT: Likes, saves, follows, trends (toggleable)
   * - FREQUENCY: Instant or Off (applies to non-essential)
   */
  private static async isNotificationEnabled(
    userId: string | undefined,
    organizationId: string | undefined,
    notificationType: string
  ): Promise<boolean> {
    try {
      // Essential notifications are always enabled
      if (this.isEssentialNotification(notificationType)) {
        return true
      }

      const supabase = createSupabaseAdminClient()
      
      // Determine which column to query
      const column = userId ? 'user_id' : 'organization_id'
      const id = userId || organizationId
      
      if (!id) return true // Default to enabled if no valid ID
      
      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('engagement_enabled, frequency')
        .eq(column, id)
        .single()
      
      if (error || !preferences) {
        // If preferences not found, default to enabled
        console.debug(`Preferences not found for ${column}:${id}, defaulting to enabled`)
        return true
      }

      // If frequency is 'off', notifications are disabled (except essential)
      if (preferences.frequency === 'off') {
        return false
      }

      // For engagement notifications, check if engagement is enabled
      if (preferences.engagement_enabled === false) {
        return false
      }

      return true
    } catch (error) {
      console.error('Error checking notification preferences:', error)
      return true // Default to enabled on error
    }
  }

  /**
   * Check if user/organization has exceeded notification rate limit
   * Limit: 100 notifications per minute per recipient
   */
  private static async isWithinRateLimit(
    userId: string | undefined,
    organizationId: string | undefined
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
        console.error('Error checking rate limit:', error)
        return true // Default to allowing on error
      }
      
      const notificationCount = count || 0
      const withinLimit = notificationCount < 100
      
      if (!withinLimit) {
        console.warn(
          `Rate limit exceeded for ${userId ? 'user' : 'organization'}: ${recipientId}. Count: ${notificationCount}`
        )
      }
      
      return withinLimit
    } catch (error) {
      console.error('Error checking rate limit:', error)
      return true // Default to allowing on error
    }
  }

  /**
   * Create a single notification for a user and emit via Socket.IO
   */
  static async createNotification(params: CreateNotificationParams) {
    try {
      if (!params.userId && !params.organizationId) {
        throw new Error('Either userId or organizationId is required to create a notification')
      }

      if (!validateNotificationType(params.type)) {
        console.warn(`Invalid notification type: ${params.type}`)
        throw new Error('Invalid notification type')
      }

      const sanitizedTitle = sanitizeInput(params.title)
      const sanitizedMessage = sanitizeInput(params.message)
      const validatedActionUrl = validateActionUrl(params.actionUrl)

      if (!sanitizedTitle || !sanitizedMessage) {
        throw new Error('Title and message are required')
      }

      // Check rate limit
      const withinLimit = await this.isWithinRateLimit(
        params.userId,
        params.organizationId
      )
      
      if (!withinLimit) {
        console.debug(
          `Notification rate limit exceeded for ${params.userId ? 'user' : 'organization'}: ${params.userId || params.organizationId}`
        )
        return null // Silently skip rate-limited notifications
      }

      // Check if this notification type is enabled for the recipient
      const isEnabled = await this.isNotificationEnabled(
        params.userId,
        params.organizationId,
        params.type
      )
      
      if (!isEnabled) {
        console.debug(
          `Notification type "${params.type}" is disabled for ${params.userId ? 'user' : 'organization'}: ${params.userId || params.organizationId}`
        )
        return null // Silently skip disabled notifications
      }

      const supabase = createSupabaseAdminClient()
      
      // Check for duplicate notification in last 60 seconds to prevent spam
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
        console.debug(
          `Duplicate notification prevented for ${params.userId ? 'user' : 'organization'}: ${recipientId}, type: ${params.type}`
        )
        return null // Skip duplicate notification
      }

      const groupingResult = await checkAndGroupNotification(
        supabase,
        recipientColumn,
        recipientId,
        params.type
      )

      if (!groupingResult.shouldCreate) {
        console.debug(
          `Notification grouped for ${recipientId}, type: ${params.type}, new count: ${groupingResult.count}`
        )
        emitNotificationToUser(recipientId, {
          id: groupingResult.groupedNotificationId,
          type: params.type,
          title: sanitizedTitle,
          message: groupingResult.count! > 2 
            ? `${groupingResult.count} yeni bildiriş` 
            : sanitizedMessage,
          data: { groupCount: groupingResult.count, grouped: true },
          isRead: false,
          createdAt: new Date().toISOString()
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
          is_read: false
        })
        .select('*')
        .single()

      if (error || !notification) {
        throw error || new Error('Failed to create notification')
      }
      
      const recipientIdForEmit = params.userId || params.organizationId || null

      // Emit real-time notification to the recipient id (user or organization account id)
      // Socket.IO works across multiple instances, so it's the primary delivery method
      if (recipientIdForEmit) {
        emitNotificationToUser(recipientIdForEmit, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.action_url,
          data: notification.data,
          isRead: notification.is_read,
          createdAt: notification.created_at
        })
      }
      
      // Only attempt SSE if Socket.IO might not reach the user (single instance mode)
      // This prevents duplicates in multi-instance where Socket.IO handles delivery
      const shouldAttemptSSE = process.env.NEXT_PUBLIC_SSE_ENABLED === 'true' && 
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
              createdAt: notification.created_at
            })
          }
        } catch (err: any) {
          console.debug('SSE sendNotificationToUser failed or no connection:', err?.message || err)
        }
      }
      
      return notification
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  /**
   * Notify user about blog approval/rejection
   */
  static async notifyBlogStatus(
    userId: string,
    blogId: string,
    blogTitle: string,
    status: 'approved' | 'rejected',
    adminComment?: string
  ) {
    const isApproved = status === 'approved'
    const title = isApproved
      ? 'Blog approved'
      : 'Blog rejected'
    
    const message = isApproved
      ? `"${blogTitle}" has been approved and is now visible.`
      : `"${blogTitle}" was rejected.${adminComment ? ` Reason: ${adminComment}` : ''}`

    const actionUrl = isApproved ? `/blogs/${blogId}` : '/profile/blogs'
    
    return this.createNotification({
      userId,
      type: isApproved ? 'blog_approved' : 'blog_rejected',
      title,
      message,
      actionUrl,
      data: {
        blogId,
        title: blogTitle,
        blogTitle,
        status,
        adminComment
      }
    })
  }

  /**
   * Notify user about vacancy approval/rejection
   */
  static async notifyVacancyStatus(
    userId: string,
    vacancyId: string,
    vacancyTitle: string,
    action: 'approve' | 'reject',
    rejectionReason?: string
  ) {
    const isApproved = action === 'approve'
    const title = isApproved
      ? '✅ Your Vacancy Was Approved!'
      : '⚠️ Your Vacancy Was Not Approved'
    
    const message = isApproved
      ? `Your vacancy "${vacancyTitle}" has been approved and is now visible to job seekers.`
      : `Your vacancy "${vacancyTitle}" was not approved. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`
    
    return this.createNotification({
      userId,
      type: isApproved ? 'vacancy_approved' : 'vacancy_rejected',
      title,
      message,
      actionUrl: `/resources/vacancies`,
      data: {
        vacancyId,
        vacancyTitle,
        action,
        rejectionReason
      }
    })
  }

  /**
   * Notify admins about new content submissions
   */
  static async notifyAdminsAboutSubmission(
    submissionType: 'blog' | 'event' | 'vacancy' | 'organization',
    submissionId: string,
    submissionTitle: string,
    submitterName: string
  ) {
    try {
      const supabase = createSupabaseAdminClient()
      const { data: admins } = await supabase
        .from('accounts')
        .select('id, account_type')
        .eq('is_admin', true)
      
      if (!admins || admins.length === 0) return

      const title = `New ${submissionType.charAt(0).toUpperCase() + submissionType.slice(1)} Submission`
      const message = `${submitterName} submitted a new ${submissionType}: "${submissionTitle}". Review needed.`
      
      let actionUrl = '/admin'
      if (submissionType === 'blog') actionUrl = `/admin/preview/blog/${submissionId}`
      if (submissionType === 'event') actionUrl = `/admin/preview/events/${submissionId}`
      if (submissionType === 'vacancy') actionUrl = `/admin/preview/vacancies/${submissionId}`
      if (submissionType === 'organization') actionUrl = '/admin/organizations'

      // Create notifications for all admins
      const notifications = admins.map((admin: any) => ({
        user_id: admin.account_type === 'user' ? admin.id : null,
        organization_id: admin.account_type === 'organization' ? admin.id : null,
        type: 'admin_action_required',
        title,
        message,
        action_url: actionUrl,
        data: {
          submissionType,
          submissionId,
          submissionTitle,
          submitterName
        },
        is_read: false
      }))

      const { data: createdNotifications } = await supabase
        .from('notifications')
        .insert(notifications)
        .select('*')
      
      // Emit real-time notifications to all admins
      const notificationRows = createdNotifications || []
      for (let i = 0; i < notificationRows.length && i < admins.length; i++) {
        const notification = notificationRows[i] as any
        const admin = admins[i] as any
        const recipientId = String(admin.id)

        emitNotificationToUser(recipientId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.action_url,
          data: notification.data,
          isRead: notification.is_read,
          createdAt: notification.created_at
        })
      }
    } catch (error) {
      console.error('Error notifying admins:', error)
    }
  }

  /**
   * Send welcome notification to new users
   */
  static async sendWelcomeNotification(userId: string, userType: 'user' | 'organization') {
    const title = 'icma360-a xoş gəlmisiniz!'
    const message = userType === 'organization'
      ? 'Təşkilat qeydiyyatınız üçün təşəkkür edirik. Təşkilat funksiyalarına daxil olmaq üçün e-poçtunuzu təsdiqləyin və admin təsdiqini gözləyin.'
      : 'İcmamıza qoşulduğunuz üçün təşəkkür edirik. Başlamaq üçün e-poçtunuzu təsdiqləyin.'

    return this.createNotification({
      userId,
      type: 'welcome',
      title,
      message,
      actionUrl: '/profile',
      data: { userType }
    })
  }

  /**
   * Notify user about password change
   */
  static async notifyPasswordChanged(userId: string) {
    return this.createNotification({
      userId,
      type: 'password_changed',
      title: 'Parol dəyişdirildi',
      message: 'Hesabınızın parolu uğurla yeniləndi.',
      actionUrl: '/profile/settings',
      data: {}
    })
  }

  /**
   * Notify user about email change initiation
   */
  static async notifyEmailChangeInitiated(userId: string, oldEmail: string, newEmail: string) {
    return this.createNotification({
      userId,
      type: 'email_change_initiated',
      title: 'E-poçt dəyişdirilir',
      message: `E-poçt ünvanınızı ${oldEmail} → ${newEmail} olaraq dəyişmək üçün təsdiq linki göndərildi. Yeni e-poçtunuzu yoxlayın.`,
      actionUrl: '/profile/settings',
      data: { oldEmail, newEmail }
    })
  }

  /**
   * Notify user about email confirmation
   */
  static async notifyEmailConfirmed(userId: string, email: string) {
    return this.createNotification({
      userId,
      type: 'email_confirmed',
      title: 'E-poçt təsdiqləndi',
      message: `E-poçt ünvanınız (${email}) uğurla təsdiqləndi. İndi bütün funksiyalardan istifadə edə bilərsiniz.`,
      actionUrl: '/profile',
      data: { email }
    })
  }

  /**
   * Check event deadlines and notify users with saved events
   */
  static async checkEventDeadlinesAndNotify() {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      const supabase = createSupabaseAdminClient()

      // Check events
      const { data: saveRows } = await supabase
        .from('content_saves')
        .select('user_id, content_id')
        .eq('content_type', 'event')

      const savesByUser = new Map<string, string[]>()
      for (const row of saveRows || []) {
        const userId = row.user_id as string | undefined
        const eventId = row.content_id as string | undefined
        if (!userId || !eventId) continue
        const list = savesByUser.get(userId) || []
        list.push(eventId)
        savesByUser.set(userId, list)
      }

      for (const [userId, savedEvents] of Array.from(savesByUser.entries())) {
        const { data: upcomingEvents } = await supabase
          .from('events')
          .select('id, slug, title, application_deadline')
          .in('id', savedEvents)
          .eq('status', 'approved')
          .gte('application_deadline', now.toISOString())
          .lte('application_deadline', threeDaysFromNow.toISOString())

        if (!upcomingEvents || upcomingEvents.length === 0) {
          continue
        }

        const since = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString()
        const { data: recentNotifications } = await supabase
          .from('notifications')
          .select('data')
          .eq('user_id', userId)
          .eq('type', 'event_deadline')
          .gte('created_at', since)

        const notifiedEventIds = new Set(
          (recentNotifications || [])
            .map(notification => (notification.data as any)?.eventId)
            .filter(Boolean)
        )

        for (const event of upcomingEvents) {
          if (notifiedEventIds.has(event.id)) {
            continue
          }

          const deadlineDate = event.application_deadline ? new Date(event.application_deadline) : null
          const daysUntilDeadline = deadlineDate
            ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
            : 0

          if (daysUntilDeadline !== 2) {
            continue
          }

          await this.createNotification({
            userId: userId,
            type: 'event_deadline',
            title: 'Tədbir müraciət son tarixi yaxınlaşır',
            message: `"${event.title}" tədbiri üçün müraciət son tarixi ${daysUntilDeadline} gün içindədir`,
            actionUrl: `/resources/events/${event.slug || event.id}`,
            data: {
              eventId: event.id,
              eventSlug: event.slug || null,
              eventTitle: event.title,
              deadline: event.application_deadline,
              daysUntilDeadline
            }
          });
        }
      }

      return {
        success: true,
        usersChecked: savesByUser.size
      };
    } catch (error) {
      console.error('Error checking event deadlines:', error);
      throw error;
    }
  }

  static async notifyOrganizationFollowersAboutNewContent(params: {
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

      const followerIds = (followers || [])
        .map((row) => row.user_id)
        .filter(Boolean)

      if (followerIds.length === 0) {
        return
      }

      const type = 'organization_new_vacancy'
      const title = 'New Vacancy from Followed Organization'
      const message = `${params.organizationName} posted: "${params.contentTitle}"`
      const routeKey = params.contentSlug || params.contentId
      const actionUrl = `/resources/vacancies/${routeKey}`

      // Use the central createNotification method for each follower to ensure:
      // 1. Single point of control for notification sending
      // 2. Notification preferences are checked
      // 3. Consistent Socket.IO + SSE delivery
      // 4. No race conditions with duplicate sends
      await Promise.all(
        followerIds.map((userId) =>
          this.createNotification({
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
            console.error(`Failed to notify follower ${userId}:`, err)
          })
        )
      )
    } catch (error) {
      console.error('Error notifying organization followers:', error)
    }
  }

  static async notifyUsersAboutRelevantItem(params: {
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
          const interests = Array.isArray(profile.interests) ? profile.interests.map((i: string) => i.toLowerCase()) : []
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
      const targetUserIds = interestedUserIds.filter((id: string) => !existingUserSet.has(id))
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
      const shouldAttemptSSE = process.env.NEXT_PUBLIC_SSE_ENABLED === 'true' && 
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
      console.error('Error notifying relevant users:', error)
    }
  }

  /**
   * Notify blog author about likes
   */
  static async notifyBlogLike(blogId: string, blogTitle: string, blogAuthorId: string) {
    return this.createNotification({
      userId: blogAuthorId,
      type: 'blog_like',
      title: 'Bloq bəyənildi',
      message: `Kimsə "${blogTitle}" bloqunu bəyəndi`,
      actionUrl: `/blogs/${blogId}`,
      data: {
        blogId,
        title: blogTitle,
        blogTitle,
      }
    });
  }

  static async notifyOrganizationFollow(params: {
    organizationId: string
    organizationName?: string | null
    followerId: string
    followerName?: string | null
    action: 'follow' | 'unfollow'
  }) {
    const orgName = params.organizationName?.trim() || 'your organization'
    const isFollow = params.action === 'follow'

    return this.createNotification({
      organizationId: params.organizationId,
      type: isFollow ? 'organization_followed' : 'organization_unfollowed',
      title: isFollow ? 'Yeni izləyici' : 'İzləyici silindi',
      message: isFollow
        ? `Kimsə ${orgName} təşkilatını izləməyə başladı.`
        : `Kimsə ${orgName} təşkilatını izləməyi dayandırdı.`,
      actionUrl: '/profile',
      data: {
        organizationId: params.organizationId,
        organizationName: params.organizationName,
        action: params.action,
      },
    })
  }

  static async notifyContentSaved(params: {
    recipientUserId?: string
    recipientOrganizationId?: string
    contentType: 'blog' | 'vacancy'
    contentId: string
    contentSlug?: string
    contentTitle: string
  }) {
    const type = `${params.contentType}_saved`
    const routeKey = params.contentSlug || params.contentId
    const actionUrl =
      params.contentType === 'blog'
        ? `/blogs/${routeKey}`
        : `/resources/vacancies/${routeKey}`

    const typeLabels = {
      blog: 'bloqunu',
      vacancy: 'vakansiyasını',
    }

    return this.createNotification({
      userId: params.recipientUserId,
      organizationId: params.recipientOrganizationId,
      type,
      title: 'Məzmun saxlanıldı',
      message: `Kimsə sizin "${params.contentTitle}" ${typeLabels[params.contentType]} saxladı.`,
      actionUrl,
      data: {
        contentType: params.contentType,
        contentId: params.contentId,
        contentSlug: params.contentSlug,
        contentTitle: params.contentTitle,
      },
    })
  }

  /**
   * Notify organization about event/vacancy likes
   * Does NOT expose user information - only tracks engagement
   */
  static async notifyContentLiked(params: {
    recipientOrganizationId: string
    contentType: 'event' | 'vacancy'
    contentId: string
    contentSlug?: string
    contentTitle: string
  }) {
    const type = `${params.contentType}_liked`
    const routeKey = params.contentSlug || params.contentId
    const actionUrl =
      params.contentType === 'event'
        ? `/resources/events/${routeKey}`
        : `/resources/vacancies/${routeKey}`

    const typeLabels = {
      event: 'tədbirini',
      vacancy: 'vakansiyasını',
    }

    return this.createNotification({
      organizationId: params.recipientOrganizationId,
      type,
      title: 'Məzmun bəyənildi',
      message: `Kimsə sizin "${params.contentTitle}" ${typeLabels[params.contentType]} bəyəndi.`,
      actionUrl,
      data: {
        contentType: params.contentType,
        contentId: params.contentId,
        contentTitle: params.contentTitle,
      },
    })
  }

  /**
   * Notify organization about content view milestones
   * Milestones: 50, 100, 500, 1000, 5000, 10000, etc.
   * Does NOT expose user information - only view count
   */
  static async notifyContentViewMilestone(params: {
    recipientOrganizationId: string
    contentType: 'event' | 'vacancy'
    contentId: string
    contentSlug?: string
    contentTitle: string
    viewCount: number
  }) {
    // Determine milestone
    const milestones = [50, 100, 500, 1000, 5000, 10000, 50000, 100000]
    let currentMilestone = 0
    for (const milestone of milestones) {
      if (params.viewCount >= milestone) {
        currentMilestone = milestone
      } else {
        break
      }
    }

    if (currentMilestone === 0) return // No milestone reached

    const type = 'content_view_milestone'
    const routeKey = params.contentSlug || params.contentId
    const actionUrl =
      params.contentType === 'event'
        ? `/resources/events/${routeKey}`
        : `/resources/vacancies/${routeKey}`

    // Format milestone message
    const formattedCount = currentMilestone >= 1000 ? (currentMilestone / 1000).toFixed(0) + 'K' : currentMilestone.toString()

    return this.createNotification({
      organizationId: params.recipientOrganizationId,
      type,
      title: '🎉 Görüntülənmə əngəsi çatıldı',
      message: `"${params.contentTitle}" ${formattedCount} görüntüləməyə çatdı!`,
      actionUrl,
      data: {
        contentType: params.contentType,
        contentId: params.contentId,
        contentTitle: params.contentTitle,
        viewCount: params.viewCount,
        milestone: currentMilestone,
      },
    })
  }

  /**
   * Check and notify users about vacancy application deadlines
   * Checks vacancies with application deadlines within the next 7 days
   * Only notifies users who have saved the vacancy
   */
  static async checkVacancyDeadlinesAndNotify() {
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
      const supabase = createSupabaseAdminClient()

      // Check saved vacancies
      const { data: saveRows } = await supabase
        .from('content_saves')
        .select('user_id, content_id')
        .eq('content_type', 'vacancy')

      const savesByUser = new Map<string, string[]>()
      for (const row of saveRows || []) {
        const userId = row.user_id as string | undefined
        const vacancyId = row.content_id as string | undefined
        if (!userId || !vacancyId) continue
        const list = savesByUser.get(userId) || []
        list.push(vacancyId)
        savesByUser.set(userId, list)
      }

      let totalNotified = 0

      for (const [userId, savedVacancies] of Array.from(savesByUser.entries())) {
        const { data: upcomingVacancies } = await supabase
          .from('vacancies')
          .select('id, slug, title, application_deadline')
          .in('id', savedVacancies)
          .eq('status', 'approved')
          .gte('application_deadline', now.toISOString())
          .lte('application_deadline', sevenDaysFromNow.toISOString())

        if (!upcomingVacancies || upcomingVacancies.length === 0) {
          continue
        }

        const since = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString()
        const { data: recentNotifications } = await supabase
          .from('notifications')
          .select('data')
          .eq('user_id', userId)
          .eq('type', 'vacancy_deadline')
          .gte('created_at', since)

        const notifiedVacancyIds = new Set(
          (recentNotifications || [])
            .map(notification => (notification.data as any)?.vacancyId)
            .filter(Boolean)
        )

        for (const vacancy of upcomingVacancies) {
          if (notifiedVacancyIds.has(vacancy.id)) {
            continue
          }

          const deadlineDate = vacancy.application_deadline ? new Date(vacancy.application_deadline) : null
          const daysUntilDeadline = deadlineDate
            ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
            : 0

          const result = await this.createNotification({
            userId: userId,
            type: 'vacancy_deadline',
            title: 'Vakansiya müraciət son tarixi yaxınlaşır',
            message: `"${vacancy.title}" vakansiyası üçün müraciət son tarixi ${daysUntilDeadline} gün içindədir`,
            actionUrl: `/resources/vacancies/${vacancy.slug || vacancy.id}`,
            data: {
              vacancyId: vacancy.id,
              vacancySlug: vacancy.slug || null,
              vacancyTitle: vacancy.title,
              deadline: vacancy.application_deadline,
              daysUntilDeadline
            }
          })

          if (result) totalNotified++
        }
      }

      return {
        usersChecked: savesByUser.size,
        vacanciesNotified: totalNotified
      }
    } catch (error) {
      console.error('Error checking vacancy deadlines:', error);
      throw error;
    }
  }
}


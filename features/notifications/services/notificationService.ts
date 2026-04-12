import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { emitNotificationToUser } from '@/lib/socket'
import { sendNotificationToUser as sendSSENotification } from '@/lib/sse'

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
   * Create a single notification for a user and emit via Socket.IO
   */
  static async createNotification(params: CreateNotificationParams) {
    try {
      if (!params.userId && !params.organizationId) {
        throw new Error('Either userId or organizationId is required to create a notification')
      }

      const supabase = createSupabaseAdminClient()
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId || null,
          organization_id: params.organizationId || null,
          type: params.type,
          title: params.title,
          message: params.message,
          action_url: params.actionUrl,
          data: params.data || {},
          related_item_id: params.relatedItemId || null,
          related_item_type: params.relatedItemType || null,
          is_read: false
        })
        .select('*')
        .single()

      if (error || !notification) {
        throw error || new Error('Failed to create notification')
      }
      
      const recipientId = params.userId || params.organizationId || null

      // Emit real-time notification to the recipient id (user or organization account id)
      if (recipientId) {
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
      
      // Also attempt to send via SSE (server-sent events) if a connection exists
      try {
        if (recipientId) {
          await sendSSENotification(recipientId, {
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
        // Non-fatal: SSE may not be available or user not connected to stream
        // Keep silent but log for debugging
        console.debug('SSE sendNotificationToUser failed or no connection:', err?.message || err)
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
   * Notify user about event approval/rejection
   */
  static async notifyEventStatus(
    userId: string,
    eventId: string,
    eventTitle: string,
    action: 'approve' | 'reject',
    rejectionReason?: string
  ) {
    const isApproved = action === 'approve'
    const title = isApproved
      ? '✅ Your Event Was Approved!'
      : '⚠️ Your Event Was Not Approved'
    
    const message = isApproved
      ? `Great news! Your event "${eventTitle}" has been approved and is now published.`
      : `Your event "${eventTitle}" was not approved. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`
    
    return this.createNotification({
      userId,
      type: isApproved ? 'event_approved' : 'event_rejected',
      title,
      message,
      actionUrl: `/resources/events`,
      data: {
        eventId,
        eventTitle,
        action,
        rejectionReason
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
   * Check event deadlines and notify users with saved events
   */
  static async checkEventDeadlinesAndNotify() {
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
      const supabase = createSupabaseAdminClient()

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
          .select('id, title, application_deadline')
          .in('id', savedEvents)
          .eq('status', 'approved')
          .gte('application_deadline', now.toISOString())
          .lte('application_deadline', sevenDaysFromNow.toISOString())

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

          await this.createNotification({
            userId: userId,
            type: 'event_deadline',
            title: 'Event deadline approaching',
            message: `The application deadline for "${event.title}" is in ${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''}`,
            actionUrl: `/resources/events/${event.id}`,
            data: {
              eventId: event.id,
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
    contentType: 'event' | 'vacancy'
    contentId: string
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

      const type = params.contentType === 'event' ? 'organization_new_event' : 'organization_new_vacancy'
      const title = params.contentType === 'event' ? 'New Event from Followed Organization' : 'New Vacancy from Followed Organization'
      const message = `${params.organizationName} posted: "${params.contentTitle}"`
      const actionUrl = `/organizations/${params.organizationId}`

      const insertPayload = followerIds.map((userId) => ({
        user_id: userId,
        type,
        title,
        message,
        action_url: actionUrl,
        data: {
          organizationId: params.organizationId,
          organizationName: params.organizationName,
          contentType: params.contentType,
          contentId: params.contentId,
          contentTitle: params.contentTitle,
        },
        is_read: false,
      }))

      const { data: createdNotifications } = await supabase
        .from('notifications')
        .insert(insertPayload)
        .select('*')

      const rows = createdNotifications || []
      for (const notification of rows) {
        emitNotificationToUser(notification.user_id, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.action_url,
          data: notification.data,
          isRead: notification.is_read,
          createdAt: notification.created_at,
        })
        await sendSSENotification(notification.user_id, {
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
    } catch (error) {
      console.error('Error notifying relevant users:', error)
    }
  }

  /**
   * Notify blog author about likes
   */
  static async notifyBlogLike(blogId: string, blogTitle: string, blogAuthorId: string, likedBy: string, likedByName: string) {
    return this.createNotification({
      userId: blogAuthorId,
      type: 'blog_like',
      title: 'Blog liked',
      message: `${likedByName} liked your blog "${blogTitle}"`,
      actionUrl: `/blogs/${blogId}`,
      data: {
        blogId,
        title: blogTitle,
        blogTitle,
        actor: {
          id: likedBy,
          name: likedByName
        },
        likedBy,
        likedByName
      }
    });
  }

  /**
   * Notify blog author about dislikes
   */
  static async notifyBlogDislike(blogId: string, blogTitle: string, blogAuthorId: string, dislikedBy: string, dislikedByName: string) {
    return this.createNotification({
      userId: blogAuthorId,
      type: 'blog_dislike',
      title: 'Blog disliked',
      message: `${dislikedByName} disliked your blog "${blogTitle}"`,
      actionUrl: `/blogs/${blogId}`,
      data: {
        blogId,
        title: blogTitle,
        blogTitle,
        actor: {
          id: dislikedBy,
          name: dislikedByName
        },
        dislikedBy,
        dislikedByName
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
    const actorName = params.followerName?.trim() || 'Someone'
    const orgName = params.organizationName?.trim() || 'your organization'
    const isFollow = params.action === 'follow'

    return this.createNotification({
      organizationId: params.organizationId,
      type: isFollow ? 'organization_followed' : 'organization_unfollowed',
      title: isFollow ? 'New follower' : 'Follower removed',
      message: isFollow
        ? `${actorName} started following ${orgName}.`
        : `${actorName} unfollowed ${orgName}.`,
      actionUrl: '/profile',
      data: {
        organizationId: params.organizationId,
        organizationName: params.organizationName,
        action: params.action,
        actor: {
          id: params.followerId,
          name: actorName,
        },
      },
    })
  }

  static async notifyContentSaved(params: {
    recipientUserId?: string
    recipientOrganizationId?: string
    contentType: 'blog' | 'event' | 'vacancy'
    contentId: string
    contentTitle: string
    savedById: string
    savedByName?: string | null
  }) {
    const actorName = params.savedByName?.trim() || 'Someone'
    const type = `${params.contentType}_saved`
    const actionUrl =
      params.contentType === 'blog'
        ? `/blogs/${params.contentId}`
        : params.contentType === 'event'
          ? `/resources/events/${params.contentId}`
          : `/resources/vacancies/${params.contentId}`

    return this.createNotification({
      userId: params.recipientUserId,
      organizationId: params.recipientOrganizationId,
      type,
      title: 'Content saved',
      message: `${actorName} saved your ${params.contentType} "${params.contentTitle}".`,
      actionUrl,
      data: {
        contentType: params.contentType,
        contentId: params.contentId,
        contentTitle: params.contentTitle,
        actor: {
          id: params.savedById,
          name: actorName,
        },
      },
    })
  }
}


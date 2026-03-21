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
          is_read: false
        })
        .select('*')
        .single()

      if (error || !notification) {
        throw error || new Error('Failed to create notification')
      }
      
      // Emit real-time notification to user (Socket.IO when available)
      if (params.userId) {
        emitNotificationToUser(params.userId, {
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
        if (params.userId) {
          await sendSSENotification(params.userId, {
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
      ? '✅ Your Story Was Approved!'
      : '⚠️ Your Story Needs Revision'
    
    const message = isApproved
      ? `Congratulations! Your story "${blogTitle}" has been approved and is now visible to the community.`
      : `Your story "${blogTitle}" was not approved. ${adminComment ? `Reason: ${adminComment}` : 'Please review and resubmit.'}`
    
    return this.createNotification({
      userId,
      type: isApproved ? 'blog_approved' : 'blog_rejected',
      title,
      message,
      actionUrl: `/blogs/${blogId}`,
      data: {
        blogId,
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
        .from('users')
        .select('id')
        .eq('role', 'admin')
      
      if (!admins || admins.length === 0) return

      const title = `New ${submissionType.charAt(0).toUpperCase() + submissionType.slice(1)} Submission`
      const message = `${submitterName} submitted a new ${submissionType}: "${submissionTitle}". Review needed.`
      
      let actionUrl = '/admin'
      if (submissionType === 'blog') {
        actionUrl = `/admin/preview/${submissionId}`
      }

      // Create notifications for all admins
      const notifications = admins.map(admin => ({
        user_id: admin.id,
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
        
        emitNotificationToUser(admin.id.toString(), {
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

      const { data: users } = await supabase
        .from('users')
        .select('id, saved_events')

      const usersWithSavedEvents = (users || []).filter(user =>
        Array.isArray(user.saved_events) && user.saved_events.length > 0
      )

      for (const user of usersWithSavedEvents) {
        const savedEvents = user.saved_events as string[]
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
          .eq('user_id', user.id)
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
            userId: user.id,
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
        usersChecked: usersWithSavedEvents.length
      };
    } catch (error) {
      console.error('Error checking event deadlines:', error);
      throw error;
    }
  }

  /**
   * Notify blog author about likes
   */
  static async notifyBlogLike(blogId: string, blogTitle: string, blogAuthorId: string, likedBy: string, likedByName: string) {
    return this.createNotification({
      userId: blogAuthorId,
      type: 'blog_like',
      title: 'Someone liked your blog',
      message: `${likedByName} liked your blog "${blogTitle}"`,
      actionUrl: `/blogs/${blogId}`,
      data: {
        blogId,
        blogTitle,
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
      title: 'Someone disliked your blog',
      message: `${dislikedByName} disliked your blog "${blogTitle}"`,
      actionUrl: `/blogs/${blogId}`,
      data: {
        blogId,
        blogTitle,
        dislikedBy,
        dislikedByName
      }
    });
  }
}


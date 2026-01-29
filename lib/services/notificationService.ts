import NotificationModel from '@/lib/models/Notification'
import User from '@/lib/models/User'
import { emitNotificationToUser } from '@/lib/socket'
import { sendNotificationToUser as sendSSENotification } from '@/lib/sse'

interface CreateNotificationParams {
  userId: string
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
      const notification = await NotificationModel.create({
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl,
        data: params.data || {},
        isRead: false
      })
      
      // Emit real-time notification to user (Socket.IO when available)
      emitNotificationToUser(params.userId, {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        data: notification.data,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      })
      
      // Also attempt to send via SSE (server-sent events) if a connection exists
      try {
        await sendSSENotification(params.userId, {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt
        })
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
    submissionType: 'blog' | 'event' | 'vacancy' | 'ngo',
    submissionId: string,
    submissionTitle: string,
    submitterName: string
  ) {
    try {
      // Get all admin users
      const admins = await User.find({ role: 'admin' }).select('_id').lean()
      
      if (admins.length === 0) return

      const title = `New ${submissionType.charAt(0).toUpperCase() + submissionType.slice(1)} Submission`
      const message = `${submitterName} submitted a new ${submissionType}: "${submissionTitle}". Review needed.`
      
      let actionUrl = '/admin'
      if (submissionType === 'blog') {
        actionUrl = `/admin/preview/${submissionId}`
      }

      // Create notifications for all admins
      const notifications = admins.map(admin => ({
        userId: admin._id,
        type: 'admin_action_required',
        title,
        message,
        actionUrl,
        data: {
          submissionType,
          submissionId,
          submissionTitle,
          submitterName
        },
        isRead: false
      }))

      const createdNotifications: any[] = await NotificationModel.insertMany(notifications)
      
      // Emit real-time notifications to all admins
      for (let i = 0; i < createdNotifications.length && i < admins.length; i++) {
        const notification = createdNotifications[i]
        const admin = admins[i] as any
        
        emitNotificationToUser(admin._id.toString(), {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt
        })
      }
    } catch (error) {
      console.error('Error notifying admins:', error)
    }
  }

  /**
   * Send welcome notification to new users
   */
  static async sendWelcomeNotification(userId: string, userType: 'user' | 'ngo') {
    const title = 'icma360-a xoş gəlmisiniz!'
    const message = userType === 'ngo'
      ? 'QHT qeydiyyatınız üçün təşəkkür edirik. QHT funksiyalarına daxil olmaq üçün e-poçtunuzu təsdiqləyin və admin təsdiqini gözləyin.'
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
      
      // Import Event model dynamically to avoid circular dependencies
      const Event = (await import('@/lib/models/Event')).default;
      
      // Find all users with saved events
      const usersWithSavedEvents = await User.find({
        savedEvents: { $exists: true, $ne: [] }
      }).select('_id savedEvents');
      
      for (const user of usersWithSavedEvents) {
        // Get user's saved events that have deadlines within 7 days
        const upcomingEvents = await Event.find({
          _id: { $in: user.savedEvents },
          status: 'approved',
          applicationDeadline: {
            $gte: now,
            $lte: sevenDaysFromNow
          }
        });
        
        // Create notifications for each upcoming event
        for (const event of upcomingEvents) {
          // Check if notification was already created
          const existingNotification = await NotificationModel.findOne({
            userId: user._id,
            type: 'event_deadline',
            'data.eventId': event._id,
            createdAt: { $gte: new Date(now.getTime() - (24 * 60 * 60 * 1000)) } // Within last 24 hours
          });
          
          if (!existingNotification) {
            const daysUntilDeadline = Math.ceil(
              (event.applicationDeadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
            );
            
            await this.createNotification({
              userId: user._id.toString(),
              type: 'event_deadline',
              title: 'Event deadline approaching',
              message: `The application deadline for "${event.title}" is in ${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''}`,
              actionUrl: `/resources/events/${event._id}`,
              data: {
                eventId: event._id,
                eventTitle: event.title,
                deadline: event.applicationDeadline,
                daysUntilDeadline
              }
            });
          }
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


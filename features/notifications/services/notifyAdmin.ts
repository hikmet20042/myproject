import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { emitNotificationToUser } from '@/lib/socket'
import { createNotification } from './core'

const DEBUG_NOTIFICATIONS = process.env.NEXT_PUBLIC_DEBUG_NOTIFICATIONS === 'true'

export async function notifyBlogStatus(
  userId: string,
  blogId: string,
  blogTitle: string,
  status: 'approved' | 'rejected',
  adminComment?: string,
) {
  const isApproved = status === 'approved'
  const title = isApproved ? 'Bloq təsdiqləndi' : 'Bloq rədd edildi'

  const message = isApproved
    ? `"${blogTitle}" təsdiqləndi və artıq görünür.`
    : `"${blogTitle}" rədd edildi.${adminComment ? ` Səbəb: ${adminComment}` : ''}`

  const actionUrl = isApproved ? `/blogs/${blogId}` : '/profile/blogs'

  return createNotification({
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
      adminComment,
    },
  })
}

export async function notifyVacancyStatus(
  userId: string,
  vacancyId: string,
  vacancyTitle: string,
  action: 'approve' | 'reject',
  rejectionReason?: string,
) {
  const isApproved = action === 'approve'
  const title = isApproved ? '✅ Vakansiya təsdiqləndi!' : '⚠️ Vakansiya təsdiqlənmədi'

  const message = isApproved
    ? `"${vacancyTitle}" vakansiyanız təsdiqləndi və iş axtaranlar üçün görünür.`
    : `"${vacancyTitle}" vakansiyanız təsdiqlənmədi. ${rejectionReason ? `Səbəb: ${rejectionReason}` : ''}`

  return createNotification({
    userId,
    type: isApproved ? 'vacancy_approved' : 'vacancy_rejected',
    title,
    message,
    actionUrl: `/resources/vacancies`,
    data: {
      vacancyId,
      vacancyTitle,
      action,
      rejectionReason,
    },
  })
}

export async function notifyAdminsAboutSubmission(
  submissionType: 'blog' | 'event' | 'vacancy' | 'organization',
  submissionId: string,
  submissionTitle: string,
  submitterName: string,
) {
  try {
    const supabase = createSupabaseAdminClient()
    const { data: admins } = await supabase
      .from('accounts')
      .select('id, account_type')
      .eq('is_admin', true)

    if (!admins || admins.length === 0) return

    const typeLabel =
      submissionType === 'blog'
        ? 'Bloq'
        : submissionType === 'event'
          ? 'Tədbir'
          : submissionType === 'vacancy'
            ? 'Vakansiya'
            : 'Təşkilat'
    const title = `Yeni ${typeLabel} Təqdimatı`
    const message = `${submitterName} yeni ${typeLabel.toLowerCase()} təqdim etdi: "${submissionTitle}". Nəzərdən keçirilməlidir.`

    let actionUrl = '/admin'
    if (submissionType === 'blog') actionUrl = `/admin/preview/blog/${submissionId}`
    if (submissionType === 'event') actionUrl = `/admin/preview/events/${submissionId}`
    if (submissionType === 'vacancy') actionUrl = `/admin/preview/vacancies/${submissionId}`
    if (submissionType === 'organization') actionUrl = '/admin/organizations'

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
        submitterName,
      },
      is_read: false,
    }))

    const { data: createdNotifications } = await supabase
      .from('notifications')
      .insert(notifications)
      .select('*')

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
        createdAt: notification.created_at,
      })
    }
  } catch (error) {
    if (DEBUG_NOTIFICATIONS) console.error('Error notifying admins:', error)
  }
}

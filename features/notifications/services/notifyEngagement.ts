import { createNotification } from './core'

export async function notifyBlogLike(blogId: string, blogTitle: string, blogAuthorId: string) {
  return createNotification({
    userId: blogAuthorId,
    type: 'blog_like',
    title: 'Bloq bəyənildi',
    message: `Kimsə "${blogTitle}" bloqunu bəyəndi`,
    actionUrl: `/blogs/${blogId}`,
    data: {
      blogId,
      title: blogTitle,
      blogTitle,
    },
  })
}

export async function notifyOrganizationFollow(params: {
  organizationId: string
  organizationName?: string | null
  followerId: string
  followerName?: string | null
  action: 'follow' | 'unfollow'
}) {
  const orgName = params.organizationName?.trim() || 'your organization'
  const isFollow = params.action === 'follow'

  return createNotification({
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

export async function notifyContentSaved(params: {
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

  return createNotification({
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

export async function notifyContentLiked(params: {
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

  return createNotification({
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

export async function notifyContentViewMilestone(params: {
  recipientOrganizationId: string
  contentType: 'event' | 'vacancy'
  contentId: string
  contentSlug?: string
  contentTitle: string
  viewCount: number
}) {
  const milestones = [50, 100, 500, 1000, 5000, 10000, 50000, 100000]
  let currentMilestone = 0
  for (const milestone of milestones) {
    if (params.viewCount >= milestone) {
      currentMilestone = milestone
    } else {
      break
    }
  }

  if (currentMilestone === 0) return

  const type = 'content_view_milestone'
  const routeKey = params.contentSlug || params.contentId
  const actionUrl =
    params.contentType === 'event'
      ? `/resources/events/${routeKey}`
      : `/resources/vacancies/${routeKey}`

  const formattedCount =
    currentMilestone >= 1000
      ? (currentMilestone / 1000).toFixed(0) + 'K'
      : currentMilestone.toString()

  return createNotification({
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

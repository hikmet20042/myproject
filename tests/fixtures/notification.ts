// ---------------------------------------------------------------------------
// Notification fixtures
// ---------------------------------------------------------------------------

export type NotificationType = 'comment' | 'like' | 'follow' | 'mention' | 'system'
export type NotificationStatus = 'unread' | 'read'

export interface NotificationFixture {
  id: string
  type: NotificationType
  title: string
  body: string
  status: NotificationStatus
  link?: string
  actorName?: string
  createdAt: string
}

const baseNotification: Omit<NotificationFixture, 'id' | 'type' | 'title' | 'body'> = {
  status: 'unread',
  actorName: 'Test User',
  createdAt: new Date().toISOString(),
}

export function makeNotification(overrides: Partial<NotificationFixture> = {}): NotificationFixture {
  const id = overrides.id ?? 'notif-1'
  return {
    ...baseNotification,
    ...overrides,
    id,
    type: overrides.type ?? 'system',
    title: overrides.title ?? 'Test Notification',
    body: overrides.body ?? 'This is a test notification.',
  }
}

export function makeNotificationList(count: number, overrides: Partial<NotificationFixture> = {}): NotificationFixture[] {
  return Array.from({ length: count }, (_, i) =>
    makeNotification({ ...overrides, id: `notif-${i + 1}`, title: `Test Notification ${i + 1}` })
  )
}

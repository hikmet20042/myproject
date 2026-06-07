// ---------------------------------------------------------------------------
// Event fixtures
// ---------------------------------------------------------------------------

export interface EventFixture {
  id: string
  slug: string
  title: string
  description: string
  status: 'pending' | 'approved' | 'rejected' | 'draft'
  startDate: string
  endDate: string
  locationType: 'online' | 'physical' | 'hybrid'
  location?: string
  onlineUrl?: string
  views: number
  likes: number
  createdAt: string
  updatedAt: string
}

const baseEvent: Omit<EventFixture, 'id' | 'slug' | 'title'> = {
  description: 'Test event description.',
  status: 'approved',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 86400000).toISOString(),
  locationType: 'online',
  onlineUrl: 'https://example.com/meet',
  views: 0,
  likes: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export function makeEvent(overrides: Partial<EventFixture> = {}): EventFixture {
  const id = overrides.id ?? 'evt-1'
  return {
    ...baseEvent,
    ...overrides,
    id,
    slug: overrides.slug ?? `test-event-${id}`,
    title: overrides.title ?? 'Test Event',
  }
}

export function makeEventList(count: number, overrides: Partial<EventFixture> = {}): EventFixture[] {
  return Array.from({ length: count }, (_, i) =>
    makeEvent({ ...overrides, id: `evt-${i + 1}`, slug: `test-event-${i + 1}`, title: `Test Event ${i + 1}` })
  )
}

// ---------------------------------------------------------------------------
// Admin list item shape — matches adminConfig.events.mapResponse input
// ---------------------------------------------------------------------------

export interface AdminEventItem {
  _id: string
  id?: string
  title: string
  status: 'pending' | 'approved' | 'rejected'
  organizationName?: string
  organizationId?: string
  startDate?: string
  endDate?: string
  createdAt?: string
  views?: number
  likes?: number
}

export function makeAdminEvent(overrides: Partial<AdminEventItem> = {}): AdminEventItem {
  const id = overrides._id ?? overrides.id ?? 'admin-evt-1'
  return {
    _id: id,
    id,
    title: overrides.title ?? 'Pending Event',
    status: overrides.status ?? 'pending',
    organizationName: overrides.organizationName,
    organizationId: overrides.organizationId,
    startDate: overrides.startDate,
    endDate: overrides.endDate,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    views: overrides.views ?? 0,
    likes: overrides.likes ?? 0,
  }
}

export function makeAdminEventList(count: number, overrides: Partial<AdminEventItem> = {}): AdminEventItem[] {
  return Array.from({ length: count }, (_, i) =>
    makeAdminEvent({ ...overrides, _id: `admin-evt-${i + 1}`, title: `Test Event ${i + 1}` })
  )
}

/**
 * Shared API types for the icma360 platform.
 * These reflect the actual API envelope and data shapes used across the app.
 */

import type { EventItem } from '@/features/events/types/items'
import type { VacancyItem } from '@/features/vacancies/types/items'

// ── API Envelope ──────────────────────────────────────────────
// Matches the { success, data, error, meta } pattern from lib/apiResponse

export type ApiEnvelope<T> = {
  success: boolean
  data: T
  error?: { code?: string; message?: string; details?: Record<string, unknown> } | null
  meta?: Record<string, unknown>
}

// ── Shared list response ──────────────────────────────────────

export type ApiListResponse<T> = {
  items: T[]
  /** Legacy shape — some endpoints use `events[]`, `vacancies[]` instead of `items[]` */
  events?: T[]
  vacancies?: T[]
}

export type ApiListResult<T> = {
  items: T[]
} & Record<string, unknown>

// ── Events ────────────────────────────────────────────────────

export type EventListPayload = ApiListResponse<EventItem>
export type EventDetailPayload = { event: EventItem }

export type EventSaveStatusPayload = {
  hasSaved?: boolean
  canSave?: boolean
}

export type EventViewPayload = {
  views?: number
  uniqueViews?: number
  likes?: number
  dislikes?: number
  engagementScore?: number
  viewIncremented?: boolean
  message?: string
}

export type EventCreatePayload = { event?: EventItem }
export type EventUpdatePayload = { event?: EventItem }
export type EventDeletePayload = { id?: string }

// ── Vacancies ──────────────────────────────────────────────────

export type VacancyListPayload = {
  vacancies?: VacancyItem[]
  items?: VacancyItem[]
}
export type VacancyDetailPayload = { vacancy: VacancyItem }
export type VacancyDeletePayload = { id?: string }

// ── Organizations (partial — full shape is OrganizationResponse) ──

// ── Blogs ──────────────────────────────────────────────────
// Matches the BlogResponse from the blog API endpoints

export type BlogItem = {
  _id: string
  id?: string
  slug: string
  title: string
  featuredImage?: string
  featured_image?: string
  authorName?: string
  author_name?: string
  author?: string | { toString?: () => string; _id?: string; name?: string }
  authorId?: string
  author_id?: string
  authorUrlHandle?: string | null
  author_url_handle?: string | null
  isAnonymous?: boolean
  is_anonymous?: boolean
  content?: unknown
  contentHtml?: string
  content_html?: string
  abstract?: string
  excerpt?: string
  tags?: string[]
  status?: string
  viewCount?: number
  views?: number
  likes?: number
  dislikes?: number
  hasLiked?: boolean
  hasDisliked?: boolean
  saves?: number
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  publishedAt?: string
  date?: string
}

export type BlogListPayload = ApiListResponse<BlogItem>
export type BlogDetailPayload = { blog: BlogItem }
export type BlogReactionsPayload = {
  likes?: number
  dislikes?: number
  hasLiked?: boolean
  hasDisliked?: boolean
}
export type BlogLikePayload = {
  action?: string
  likes?: number
  dislikes?: number
  hasLiked?: boolean
  hasDisliked?: boolean
  engagementScore?: number
}
export type BlogDeletePayload = { id?: string }

// ── Notifications ────────────────────────────────────────────

export type NotificationPayload = {
  id: string
  type: string
  title: string
  message: string
  actionUrl?: string | null
  data?: Record<string, unknown>
  isRead: boolean
  createdAt: string
}

// ── Comments ────────────────────────────────────────────────────

export type CommentPayload = {
  id?: string
  blogId: string
  authorId?: string
  authorName?: string
  content: string
  createdAt?: string
}

export type CommentEventPayload = {
  blogId: string
  comment: CommentPayload
}

export type CommentUpdateEvent = Record<string, unknown>

export type NotificationUpdatePayload = Record<string, unknown>

export type BulkNotificationUpdatePayload = Record<string, unknown>

// ── SSE Payloads ────────────────────────────────────────────────

export type SSEEventPayload = Record<string, unknown>

import type { OrganizationResponse } from '@/lib/organizationProfile'

export type OrganizationListPayload = { items: OrganizationResponse[] }
export type OrganizationDetailPayload = {
  organization: OrganizationResponse
  featuredEvent?: EventItem | null
  featuredVacancy?: VacancyItem | null
}
export type OrganizationMePayload = { organization: OrganizationResponse }
export type OrganizationUpdatePayload = { organization?: OrganizationResponse; message?: string }

export type OrganizationFollowPayload = {
  organizationId: string
  isFollowing: boolean
  followerCount: number
}

export type FollowedOrganizationsPayload = { items: OrganizationResponse[] }

// ── Resolve helpers ────────────────────────────────────────────

export type ResolveResult = {
  id?: string
  slug?: string
}

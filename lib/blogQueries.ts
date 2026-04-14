import { apiFetch } from "@/lib/apiClient"

type BlogListParams = {
  page?: number
  limit?: number
  search?: string
  tags?: string
  status?: string
}

type ListQueryResult<T = any> = {
  items: T[]
} & Record<string, any>

const toQueryString = (params: BlogListParams = {}) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })
  return searchParams.toString()
}

export const blogQueryKeys = {
  all: ['blogs'] as const,
  list: (params: BlogListParams = {}) => ['blogs', 'list', params] as const,
  user: ['blogs', 'user'] as const,
  detail: (slug: string) => ['blog', slug] as const,
  reactions: (slug: string) => ['blog', slug, 'reactions'] as const
}

export const fetchBlogs = async (params: BlogListParams = {}): Promise<ListQueryResult> => {
  const query = toQueryString(params)
  const { data, meta } = await apiFetch<{ items: any[] }>(
    `/api/blogs${query ? `?${query}` : ''}`
  )
  const items = Array.isArray(data.items) ? data.items : []
  return {
    items,
    ...meta,
  }
}

export const fetchBlogBySlug = async (slug: string) => {
  const { data } = await apiFetch<{ blog: any }>(`/api/blogs/${slug}`)
  return data?.blog || null
}

/** @deprecated Use fetchBlogBySlug instead */
export const fetchBlogById = fetchBlogBySlug

export const fetchUserBlogs = async (): Promise<ListQueryResult> => {
  const { data, meta } = await apiFetch<{ items: any[] }>('/api/blogs/user')
  const items = Array.isArray(data.items) ? data.items : []
  return {
    items,
    ...meta,
  }
}

export const fetchBlogReactions = async (slug: string) => {
  const [likeResult, dislikeResult] = await Promise.all([
    apiFetch<{ likes?: number; hasLiked?: boolean }>(`/api/blogs/${slug}/like`),
    apiFetch<{ dislikes?: number; hasDisliked?: boolean }>(`/api/blogs/${slug}/dislike`)
  ])
  return {
    likes: likeResult.data?.likes || 0,
    dislikes: dislikeResult.data?.dislikes || 0,
    hasLiked: !!likeResult.data?.hasLiked,
    hasDisliked: !!dislikeResult.data?.hasDisliked
  }
}

export const likeBlog = async (slug: string) => {
  const { data } = await apiFetch<{
    action?: string
    likes?: number
    dislikes?: number
    hasLiked?: boolean
    hasDisliked?: boolean
    engagementScore?: number
  }>(`/api/blogs/${slug}/like`, { method: 'POST' })
  return data
}

export const dislikeBlog = async (slug: string) => {
  const { data } = await apiFetch<{
    action?: string
    likes?: number
    dislikes?: number
    hasLiked?: boolean
    hasDisliked?: boolean
    engagementScore?: number
  }>(`/api/blogs/${slug}/dislike`, { method: 'POST' })
  return data
}

export const editBlog = async (slug: string, payload: Record<string, any>) => {
  const { data } = await apiFetch<{ blog: any }>(`/api/blogs/${slug}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return data
}

export const deleteBlog = async (slug: string) => {
  const { data } = await apiFetch<{ id?: string }>(`/api/blogs/${slug}`, { method: 'DELETE' })
  return data
}

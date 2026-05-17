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
  detail: (id: string) => ['blog', id] as const,
  reactions: (id: string) => ['blog', id, 'reactions'] as const
}

export const resolveBlogIdentifier = async (identifier: string) => {
  const { data } = await apiFetch<{ id?: string; slug?: string }>(`/api/blogs/resolve/${identifier}`)
  return { id: data?.id || '', slug: data?.slug || '' }
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

export const fetchBlogById = async (id: string) => {
  const { data } = await apiFetch<{ blog: any }>(`/api/blogs/${id}`)
  return data?.blog || null
}

export const fetchBlogBySlug = async (slug: string) => {
  const { id } = await resolveBlogIdentifier(slug)
  if (!id) return null
  return fetchBlogById(id)
}

export const fetchUserBlogs = async (): Promise<ListQueryResult> => {
  const { data, meta } = await apiFetch<{ items: any[] }>('/api/blogs/user')
  const items = Array.isArray(data.items) ? data.items : []
  return {
    items,
    ...meta,
  }
}

export const fetchBlogReactions = async (id: string) => {
  const [likeResult, dislikeResult] = await Promise.all([
    apiFetch<{ likes?: number; hasLiked?: boolean }>(`/api/blogs/${id}/like`),
    apiFetch<{ dislikes?: number; hasDisliked?: boolean }>(`/api/blogs/${id}/dislike`)
  ])
  return {
    likes: likeResult.data?.likes || 0,
    dislikes: dislikeResult.data?.dislikes || 0,
    hasLiked: !!likeResult.data?.hasLiked,
    hasDisliked: !!dislikeResult.data?.hasDisliked
  }
}

export const likeBlog = async (id: string) => {
  const { data } = await apiFetch<{
    action?: string
    likes?: number
    dislikes?: number
    hasLiked?: boolean
    hasDisliked?: boolean
    engagementScore?: number
  }>(`/api/blogs/${id}/like`, { method: 'POST' })
  return data
}

export const dislikeBlog = async (id: string) => {
  const { data } = await apiFetch<{
    action?: string
    likes?: number
    dislikes?: number
    hasLiked?: boolean
    hasDisliked?: boolean
    engagementScore?: number
  }>(`/api/blogs/${id}/dislike`, { method: 'POST' })
  return data
}

export const editBlog = async (id: string, payload: Record<string, any>) => {
  const { data } = await apiFetch<{ blog: any }>(`/api/blogs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return data
}

export const deleteBlog = async (id: string) => {
  const { data } = await apiFetch<{ id?: string }>(`/api/blogs/${id}`, { method: 'DELETE' })
  return data
}

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiClient'

type EventListParams = {
  page?: number
  limit?: number
  category?: string
  eventType?: string
  city?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  status?: string
  author?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

type ListQueryResult<T = any> = {
  items: T[]
} & Record<string, any>

const toQueryString = (params: EventListParams = {}) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })
  return searchParams.toString()
}

export const eventQueryKeys = {
  all: ['events'] as const,
  list: (params: EventListParams = {}) => ['events', params] as const,
  mine: (page = 1) => ['events', { author: 'me', page }] as const,
  detail: (slug: string) => ['event', slug] as const,
  save: (slug: string) => ['events', slug, 'save'] as const,
  view: (slug: string) => ['events', slug, 'view'] as const
}

export const fetchEvents = async (params: EventListParams = {}): Promise<ListQueryResult> => {
  const query = toQueryString(params)
  const { data, meta } = await apiFetch<{ items?: any[]; events?: any[] }>(
    `/api/events${query ? `?${query}` : ''}`
  )
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.events)
      ? data.events
      : []
  return {
    items,
    ...meta,
  }
}

export const fetchUserEvents = async (page = 1) => {
  const data = await fetchEvents({ author: 'me', page, limit: 20 })
  return data.items || []
}

export const fetchEventBySlug = async (slug: string) => {
  const { data } = await apiFetch<{ event?: any }>(`/api/events/${slug}`)
  return data?.event || null
}

/** @deprecated Use fetchEventBySlug instead */
export const fetchEventById = fetchEventBySlug

export const createEvent = async (payload: Record<string, any> | FormData) => {
  const isFormData = payload instanceof FormData
  const { data } = await apiFetch<{ event?: any }>('/api/events', {
    method: 'POST',
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    body: isFormData ? payload : JSON.stringify(payload)
  })
  return data
}

export const updateEvent = async (slug: string, payload: Record<string, any>) => {
  const { data } = await apiFetch<{ event?: any }>(`/api/events/${slug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return data
}

export const deleteEvent = async (slug: string) => {
  const { data } = await apiFetch<{ id?: string }>(`/api/events/${slug}`, { method: 'DELETE' })
  return data
}

export const saveEvent = async (slug: string) => {
  const { data } = await apiFetch<{
    action?: string
    hasSaved?: boolean
  }>(`/api/content/event/${slug}/save`, { method: 'POST' })
  return data
}

export const fetchEventSaveStatus = async (slug: string) => {
  const { data } = await apiFetch<{ hasSaved?: boolean; canSave?: boolean }>(`/api/content/event/${slug}/save`)
  return data
}

export const trackView = async (slug: string, payload?: { isFirstView?: boolean }) => {
  const { data } = await apiFetch<{
    views?: number
    uniqueViews?: number
    likes?: number
    dislikes?: number
    engagementScore?: number
    viewIncremented?: boolean
    message?: string
  }>(`/api/events/${slug}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {})
  })
  return data
}

export const fetchEventViews = async (slug: string) => {
  const { data } = await apiFetch<{
    views?: number
    uniqueViews?: number
    likes?: number
    dislikes?: number
    engagementScore?: number
  }>(`/api/events/${slug}/view`)
  return data
}

export const useEvents = (page = 1) => {
  return useQuery({
    queryKey: eventQueryKeys.mine(page),
    queryFn: () => fetchUserEvents(page),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1
  })
}

export const useEvent = (id: string) => {
  return useQuery({
    queryKey: eventQueryKeys.detail(id),
    queryFn: () => fetchEventById(id),
    enabled: Boolean(id),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1
  })
}

export const prefetchEventDetail = async (queryClient: QueryClient, id: string) => {
  if (!id) {
    return
  }

  await queryClient.prefetchQuery({
    queryKey: eventQueryKeys.detail(id),
    queryFn: () => fetchEventById(id),
    staleTime: 60_000
  })
}

export const useCreateEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, any> | FormData) => createEvent(payload),
    onMutate: async () => {
      return {}
    },
    onError: () => {},
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: eventQueryKeys.all })
    }
  })
}

export const useUpdateEvent = (id: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, any>) => updateEvent(id, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: eventQueryKeys.all })
      await queryClient.cancelQueries({ queryKey: eventQueryKeys.detail(id) })

      const previousMineQueries = queryClient.getQueriesData<any[]>({ queryKey: eventQueryKeys.all })
      const previousDetail = queryClient.getQueryData<any>(eventQueryKeys.detail(id))
      const lifecyclePatch =
        previousDetail?.status === 'approved'
          ? {
              status: 'pending',
              isPublished: false,
              approvedAt: null,
              approvedBy: null
            }
          : {}
      const optimistic = {
        ...(previousDetail || {}),
        ...payload,
        ...lifecyclePatch,
        _id: id,
        id
      }

      queryClient.setQueryData(eventQueryKeys.detail(id), optimistic)
      queryClient.setQueriesData({ queryKey: eventQueryKeys.all }, (old: any[] | undefined) => {
        if (!Array.isArray(old)) return old
        return old.map((event) =>
          event?._id === id || event?.id === id ? { ...event, ...payload, ...lifecyclePatch } : event
        )
      })

      return { previousMineQueries, previousDetail }
    },
    onError: (_error, _payload, context) => {
      if (context?.previousMineQueries) {
        context.previousMineQueries.forEach(([queryKey, previousValue]) => {
          queryClient.setQueryData(queryKey, previousValue)
        })
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(eventQueryKeys.detail(id), context.previousDetail)
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: eventQueryKeys.all })
      await queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(id) })
    }
  })
}

export const useDeleteEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: eventQueryKeys.all })
      await queryClient.cancelQueries({ queryKey: eventQueryKeys.detail(id) })

      const previousMineQueries = queryClient.getQueriesData<any[]>({ queryKey: eventQueryKeys.all })
      const previousDetail = queryClient.getQueryData<any>(eventQueryKeys.detail(id))

      queryClient.setQueriesData({ queryKey: eventQueryKeys.all }, (old: any[] | undefined) => {
        if (!Array.isArray(old)) return old
        return old.filter((event) => event?._id !== id && event?.id !== id)
      })
      queryClient.removeQueries({ queryKey: eventQueryKeys.detail(id) })

      return { previousMineQueries, previousDetail, id }
    },
    onError: (_error, _id, context) => {
      if (context?.previousMineQueries) {
        context.previousMineQueries.forEach(([queryKey, previousValue]) => {
          queryClient.setQueryData(queryKey, previousValue)
        })
      }
      if (context?.previousDetail && context?.id) {
        queryClient.setQueryData(eventQueryKeys.detail(context.id), context.previousDetail)
      }
    },
    onSettled: async (_data, _error, id) => {
      await queryClient.invalidateQueries({ queryKey: eventQueryKeys.all })
      if (id) {
        await queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(id) })
      }
    }
  })
}

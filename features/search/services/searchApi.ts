import { apiFetch } from '@/lib/apiClient'
import type { GlobalSearchResponse, GlobalSearchType } from '@/features/search/types/search.types'

type SearchQueryOptions = {
  query: string
  types?: GlobalSearchType[]
  page?: number
  limit?: number
}

export const fetchGlobalSearch = async ({ query, types, page = 1, limit = 12 }: SearchQueryOptions) => {
  const params = new URLSearchParams()
  params.set('q', query)
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (types && types.length > 0) {
    params.set('types', types.join(','))
  }

  const response = await apiFetch<GlobalSearchResponse>(`/api/search?${params.toString()}`)
  return response.data
}

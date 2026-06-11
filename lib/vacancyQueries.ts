import { apiFetch } from "@/lib/apiClient"

type VacancyListParams = {
  page?: number
  limit?: number
  search?: string
  type?: string
  city?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'applicationDeadline'
  sortOrder?: 'asc' | 'desc'
  status?: string
}

type ListQueryResult<T = any> = {
  items: T[]
} & Record<string, any>

const toQueryString = (params: VacancyListParams = {}) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })
  return searchParams.toString()
}

export const vacancyQueryKeys = {
  all: ['vacancies'] as const,
  list: (params: VacancyListParams = {}) => ['vacancies', 'list', params] as const,
  detail: (id: string) => ['vacancy', id] as const,
}

export const fetchVacancies = async (params: VacancyListParams = {}): Promise<ListQueryResult> => {
  const query = toQueryString(params)
  const { data, meta } = await apiFetch<{ vacancies: any[]; items?: any[] }>(
    `/api/vacancies${query ? `?${query}` : ''}`
  )
  const items = Array.isArray(data.vacancies) ? data.vacancies : (Array.isArray(data.items) ? data.items : [])
  return {
    items,
    ...meta,
  }
}

export const fetchVacancyById = async (id: string) => {
  const { data } = await apiFetch<{ vacancy: any }>(`/api/vacancies/${id}`)
  return data?.vacancy || null
}

export const fetchVacancyBySlug = async (slug: string) => {
  const { data } = await apiFetch<{ vacancy: any }>(`/api/vacancies/resolve/${slug}`)
  return data?.vacancy || null
}

export const deleteVacancy = async (id: string) => {
  const { data } = await apiFetch<{ id?: string }>(`/api/vacancies/${id}`, { method: 'DELETE' })
  return data
}

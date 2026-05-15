'use client'

import { useEffect, useMemo, useState } from 'react'
import { fetchGlobalSearch } from '@/features/search/services/searchApi'
import type { GlobalSearchItem, GlobalSearchType } from '@/features/search/types/search.types'

type UseGlobalSearchOptions = {
  query: string
  enabled?: boolean
  debounceMs?: number
  types?: GlobalSearchType[]
  page?: number
  limit?: number
}

export const useGlobalSearch = ({
  query,
  enabled = true,
  debounceMs = 300,
  types,
  page = 1,
  limit = 12,
}: UseGlobalSearchOptions) => {
  const [items, setItems] = useState<GlobalSearchItem[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)
  const [totalsByType, setTotalsByType] = useState<Record<GlobalSearchType, number>>({
    event: 0,
    vacancy: 0,
    blog: 0,
    organization: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedQuery = useMemo(() => query.trim(), [query])

  useEffect(() => {
    if (!enabled || !trimmedQuery) {
      setItems([])
      setTotal(0)
      setPages(0)
      setTotalsByType({ event: 0, vacancy: 0, blog: 0, organization: 0 })
      setLoading(false)
      setError(null)
      return
    }

    let isCancelled = false
    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchGlobalSearch({
          query: trimmedQuery,
          types,
          page,
          limit,
        })

        if (isCancelled) return

        setItems(response.items)
        setTotal(response.pagination.total)
        setPages(response.pagination.pages)
        setTotalsByType(response.totalsByType)
      } catch (fetchError: any) {
        if (isCancelled) return
        setError(fetchError?.message || 'Axtarış zamanı xəta baş verdi')
        setItems([])
        setTotal(0)
        setPages(0)
        setTotalsByType({ event: 0, vacancy: 0, blog: 0, organization: 0 })
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }, debounceMs)

    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [enabled, trimmedQuery, debounceMs, page, limit, types])

  return {
    items,
    total,
    pages,
    totalsByType,
    loading,
    error,
  }
}

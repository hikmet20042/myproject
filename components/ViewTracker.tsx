'use client'

import { useEffect, useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth/client'
import { Eye } from 'lucide-react'
import { eventQueryKeys, fetchEventViews, trackView } from '@/lib/eventQueries'

interface ViewTrackerProps { itemId: string
  itemType: 'event' | 'vacancy' | 'blog'
  initialViews?: number
  showCount?: boolean
  className?: string }

export default function ViewTracker({ itemId,
  itemType,
  initialViews = 0,
  showCount = true,
  className = '' }: ViewTrackerProps) { const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [views, setViews] = useState(initialViews)
  const [hasTracked, setHasTracked] = useState(false)
  const hasTrackedRef = useRef(false)
  const isEvent = itemType === 'event'

  const eventViewsQuery = useQuery({
    queryKey: eventQueryKeys.view(itemId),
    queryFn: () => fetchEventViews(itemId),
    enabled: isEvent,
    initialData: { views: initialViews }
  })

  const trackEventMutation = useMutation({
    mutationFn: (isFirstView: boolean) => trackView(itemId, { isFirstView }),
    onSuccess: (data) => {
      queryClient.setQueryData(eventQueryKeys.view(itemId), {
        views: data.views || 0
      })
      queryClient.setQueryData(eventQueryKeys.detail(itemId), (previous: any) =>
        previous ? { ...previous, views: data.views || 0 } : previous
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: eventQueryKeys.view(itemId) })
      queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(itemId) })
    }
  })

  useEffect(() => { if (hasTracked || hasTrackedRef.current) return
    hasTrackedRef.current = true

    const trackView = async () => { try {
        const viewedKey = `viewed_${itemType}_${itemId}`

        let isFirstView = true
        if (!session?.user?.id) {
          if (sessionStorage.getItem(viewedKey)) { isFirstView = false } }

        if (isEvent) {
          const data = await trackEventMutation.mutateAsync(isFirstView)
          setViews(data.views || 0)
          setHasTracked(true)
          if (!session?.user?.id && data.viewIncremented) { sessionStorage.setItem(viewedKey, 'true') }
          return
        }

        const endpoint = itemType === 'vacancy'
            ? `/api/vacancies/${itemId}/view`
            : `/api/blogs/${itemId}/view`

        const response = await fetch(endpoint, { method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isFirstView }) })

        if (response.ok) { const data = await response.json()
          setViews(data.views)
          setHasTracked(true)

          if (!session?.user?.id && data.viewIncremented) { sessionStorage.setItem(viewedKey, 'true') } } } catch (error) { console.error('Error tracking view:', error) } }

    const timer = setTimeout(() => { trackView() }, 1000)

    return () => clearTimeout(timer) }, [itemId, itemType, session, hasTracked, isEvent, trackEventMutation])

  useEffect(() => { if (initialViews > 0) return
    if (isEvent) return

    const fetchViews = async () => { try { const endpoint = itemType === 'vacancy'
            ? `/api/vacancies/${itemId}/view`
            : `/api/blogs/${itemId}/view`

        const response = await fetch(endpoint)
        if (response.ok) { const data = await response.json()
          setViews(data.views) } } catch (error) { console.error('Error fetching views:', error) } }

    fetchViews() }, [itemId, itemType, initialViews, isEvent])

  if (!showCount) return null

  const currentViews = isEvent ? (eventViewsQuery.data?.views ?? views) : views
  const locale = 'az-AZ'
  const formattedViews = currentViews.toLocaleString(locale)
  const viewLabel = `${formattedViews} baxış`

  return (
    <div className={`inline-flex items-center gap-1.5 text-gray-600 ${className}`}>
      <Eye className="w-4 h-4" />
      <span className="text-sm font-medium">
        {viewLabel}
      </span>
    </div>
  ) }

'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Eye } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface ViewTrackerProps {
  itemId: string
  itemType: 'event' | 'vacancy' | 'blog'
  initialViews?: number
  showCount?: boolean
  className?: string
}

export default function ViewTracker({
  itemId,
  itemType,
  initialViews = 0,
  showCount = true,
  className = ''
}: ViewTrackerProps) {
  const { data: session } = useSession()
  const { t, language } = useLanguage()
  const [views, setViews] = useState(initialViews)
  const [hasTracked, setHasTracked] = useState(false)
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    if (hasTracked || hasTrackedRef.current) return
    hasTrackedRef.current = true // Mark as tracking immediately

    // We use a local flag or ref to ensure we only trigger this once
    // but relies on the effect dependency array effectively

    const trackView = async () => {
      try {
        // Check session storage for guests to prevent duplicate views
        const viewedKey = `viewed_${itemType}_${itemId}`

        let isFirstView = true
        if (!session?.user?.id) {
          // Guest user - check session storage
          if (sessionStorage.getItem(viewedKey)) {
            isFirstView = false
          }
        }

        const endpoint = itemType === 'event'
          ? `/api/events/${itemId}/view`
          : itemType === 'vacancy'
            ? `/api/vacancies/${itemId}/view`
            : `/api/blogs/${itemId}/view`

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isFirstView })
        })

        if (response.ok) {
          const data = await response.json()
          setViews(data.views)
          setHasTracked(true)

          // For guests, save to session storage if view was incremented
          if (!session?.user?.id && data.viewIncremented) {
            sessionStorage.setItem(viewedKey, 'true')
          }
        }
      } catch (error) {
        console.error('Error tracking view:', error)
      }
    }

    // Track view after a small delay to ensure page is loaded
    const timer = setTimeout(() => {
      trackView()
    }, 1000)

    return () => clearTimeout(timer)
  }, [itemId, itemType, session, hasTracked])

  // Fetch current view count only if not provided or 0
  useEffect(() => {
    if (initialViews > 0) return

    const fetchViews = async () => {
      try {
        const endpoint = itemType === 'event'
          ? `/api/events/${itemId}/view`
          : itemType === 'vacancy'
            ? `/api/vacancies/${itemId}/view`
            : `/api/blogs/${itemId}/view`

        const response = await fetch(endpoint)
        if (response.ok) {
          const data = await response.json()
          setViews(data.views)
        }
      } catch (error) {
        console.error('Error fetching views:', error)
      }
    }

    fetchViews()
  }, [itemId, itemType, initialViews])

  if (!showCount) return null

  const locale = language === 'az' ? 'az-AZ' : 'en-US'
  const formattedViews = views.toLocaleString(locale)
  const viewLabelKey = views === 1 ? 'viewTracker.singular' : 'viewTracker.plural'

  return (
    <div className={`inline-flex items-center gap-1.5 text-gray-600 ${className}`}>
      <Eye className="w-4 h-4" />
      <span className="text-sm font-medium">
        {t(viewLabelKey, { count: formattedViews })}
      </span>
    </div>
  )
}

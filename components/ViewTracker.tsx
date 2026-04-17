'use client'

import { useEffect, useRef, useState } from 'react'

type ViewTrackerProps = {
  itemType: 'blog' | 'event' | 'vacancy'
  itemId: string
  /** Minimum time on page (ms) before a view is counted. Default: 10000 (10s) */
  minTimeMs?: number
  /** Whether to track only once per session (tab). Default: true */
  oncePerSession?: boolean
  /** CSS selector for the element to observe. Defaults to observing the body. */
  selector?: string
}

/**
 * Unified view tracker for blogs, events, and vacancies.
 */
export default function ViewTracker({
  itemType,
  itemId,
  minTimeMs = 10_000,
  oncePerSession = true,
  selector,
}: ViewTrackerProps) {
  const hasTrackedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (hasTrackedRef.current) return

    // Client-side: skip if already tracked in this tab
    const storageKey = `view_tracked_${itemType}_${itemId}`
    if (oncePerSession && sessionStorage.getItem(storageKey)) {
      console.log(`[ViewTracker] Already tracked ${itemType} ${itemId} in this session`)
      hasTrackedRef.current = true
      return
    }

    const target = selector ? document.querySelector(selector) : document.body
    if (!target) {
      console.warn(`[ViewTracker] Target element not found for ${itemType} ${itemId}, selector: "${selector}"`)
      return
    }
    console.log(`[ViewTracker] Initialized observer for ${itemType} ${itemId}, selector: "${selector}"`)

    // IntersectionObserver: only count when content is actually visible
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Prevent multiple timers from being scheduled
          if (hasTrackedRef.current || timerRef.current) return
          
          if (entry.isIntersecting) {
            console.log(`[ViewTracker] Content intersecting for ${itemType} ${itemId}, starting ${minTimeMs}ms timer`)
            // Start the minimum time-on-page timer
            const viewStartTime = Date.now()
            timerRef.current = setTimeout(() => {
              if (hasTrackedRef.current) return
              hasTrackedRef.current = true

              if (oncePerSession) {
                sessionStorage.setItem(storageKey, '1')
              }

              // View tracking call
              const endpoint = `/api/${
                itemType === 'blog' ? 'blogs' : itemType === 'event' ? 'events' : 'vacancies'
              }/${itemId}/view`

              console.log(`[ViewTracker] Sending POST to ${endpoint}`)
              fetch(endpoint, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'X-View-Start-Time': viewStartTime.toString()
                },
                credentials: 'include',
              })
                .then((res) => {
                  console.log(`[ViewTracker] POST ${endpoint} response: ${res.status} ${res.statusText}`)
                  if (!res.ok) {
                    return res.text().then((text) => {
                      console.error(`[ViewTracker] POST error response: ${text}`)
                    })
                  }
                  return res.json().then((data) => {
                    console.log(`[ViewTracker] POST success:`, data)
                  })
                })
                .catch((err) => {
                  console.error(`[ViewTracker] POST failed:`, err)
                })
            }, minTimeMs)
          } else {
            // Reset timer if content goes out of view
            console.log(`[ViewTracker] Content out of view for ${itemType} ${itemId}, resetting timer`)
            if (timerRef.current) {
              clearTimeout(timerRef.current)
              timerRef.current = null
            }
          }
        }
      },
      { threshold: 0.1 } // 10% visibility is enough to start the timer
    )

    observer.observe(target)
    console.log(`[ViewTracker] Observer attached for ${itemType} ${itemId}`)

    return () => {
      observer.disconnect()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      console.log(`[ViewTracker] Cleanup for ${itemType} ${itemId}`)
    }
  }, [itemType, itemId, minTimeMs, oncePerSession, selector])

  return null
}


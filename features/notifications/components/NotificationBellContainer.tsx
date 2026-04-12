'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Loader2 } from 'lucide-react'
import { useSession } from '@/lib/auth/client'
import { type NotificationItem, useNotificationContext } from '@/features/notifications/context/NotificationContext'
import { useSSENotifications } from '@/features/notifications/providers/SSENotificationProvider'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import NotificationItemRow from '@/components/ui/notifications/NotificationItem'

interface NotificationBellContainerProps {
  className?: string
}

export default function NotificationBellContainer({ className = '' }: NotificationBellContainerProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { isConnected: sseConnected } = useSSENotifications()
  const [enabled, setEnabled] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    ensureFreshNotifications,
    toggleNotificationRead,
    markAllAsRead,
  } = useNotificationContext()
  const localePath = useLocalizedPath()
  const viewAllNotificationsPath = localePath('/notifications')
  const notificationsRef = useRef<HTMLDivElement>(null)

  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set())
  const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set())
  const [actionLoadingIds, setActionLoadingIds] = useState<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [markAllLoading, setMarkAllLoading] = useState(false)
  const [badgePopping, setBadgePopping] = useState(false)

  const prevNotificationIdsRef = useRef<Set<string>>(new Set())
  const initializedIdsRef = useRef(false)
  const previousUnreadRef = useRef(unreadCount)

  const enteringTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const highlightTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    const timer = setTimeout(() => {
      setEnabled(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Polling fallback when SSE connection is down.
  useEffect(() => {
    if (!enabled || !session?.user?.id || sseConnected) return

    const pollInterval = setInterval(() => {
      refreshNotifications()
    }, 30000)

    return () => clearInterval(pollInterval)
  }, [enabled, session?.user?.id, sseConnected, refreshNotifications])

  useEffect(() => {
    if (!initializedIdsRef.current) {
      prevNotificationIdsRef.current = new Set(notifications.map((n) => n._id))
      initializedIdsRef.current = true
      return
    }

    const currentIds = notifications.map((notification) => notification._id)
    const previousIds = prevNotificationIdsRef.current
    const newIds = currentIds.filter((id) => !previousIds.has(id))

    if (newIds.length > 0) {
      setEnteringIds((prev) => {
        const next = new Set(prev)
        for (const id of newIds) next.add(id)
        return next
      })

      setHighlightedIds((prev) => {
        const next = new Set(prev)
        for (const id of newIds) next.add(id)
        return next
      })

      for (const id of newIds) {
        const existingEnterTimer = enteringTimeoutsRef.current[id]
        if (existingEnterTimer) clearTimeout(existingEnterTimer)

        const existingHighlightTimer = highlightTimeoutsRef.current[id]
        if (existingHighlightTimer) clearTimeout(existingHighlightTimer)

        enteringTimeoutsRef.current[id] = setTimeout(() => {
          setEnteringIds((prev) => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
          delete enteringTimeoutsRef.current[id]
        }, 320)

        highlightTimeoutsRef.current[id] = setTimeout(() => {
          setHighlightedIds((prev) => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
          delete highlightTimeoutsRef.current[id]
        }, 2600)
      }
    }

    prevNotificationIdsRef.current = new Set(currentIds)
  }, [notifications])

  useEffect(() => {
    if (previousUnreadRef.current !== unreadCount) {
      setBadgePopping(true)
      const timer = setTimeout(() => setBadgePopping(false), 260)
      previousUnreadRef.current = unreadCount
      return () => clearTimeout(timer)
    }

    previousUnreadRef.current = unreadCount
  }, [unreadCount])

  useEffect(() => {
    const enteringTimeouts = enteringTimeoutsRef.current
    const highlightTimeouts = highlightTimeoutsRef.current

    return () => {
      Object.values(enteringTimeouts).forEach((timer) => clearTimeout(timer))
      Object.values(highlightTimeouts).forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const visibleNotifications = useMemo(() => notifications.slice(0, 10), [notifications])

  const handleNotificationsToggle = useCallback(() => {
    if (!notificationsOpen) {
      void ensureFreshNotifications(45000)
    }
    setNotificationsOpen((prev) => !prev)
  }, [notificationsOpen, ensureFreshNotifications])

  const handleNotificationClick = useCallback(
    (notification: NotificationItem) => {
      if (!notification.isRead) {
        void toggleNotificationRead(notification._id, true)
      }

    setNotificationsOpen(false)

      if (notification.actionUrl) {
        try {
          const targetUrl = new URL(notification.actionUrl, window.location.origin)
          if (targetUrl.origin === window.location.origin) {
            router.push(`${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`)
            return
          }
        } catch {
          // Fallback to hard navigation below for malformed URLs.
        }

        window.location.href = notification.actionUrl
      }
    },
    [router, toggleNotificationRead]
  )

  const handleToggleRead = useCallback(
    async (notificationId: string, nextReadValue: boolean) => {
      setActionLoadingIds((prev) => {
        const next = new Set(prev)
        next.add(notificationId)
        return next
      })

      try {
        await toggleNotificationRead(notificationId, nextReadValue)
      } finally {
        setActionLoadingIds((prev) => {
          const next = new Set(prev)
          next.delete(notificationId)
          return next
        })
      }
    },
    [toggleNotificationRead]
  )

  const handleDelete = useCallback(
    async (notificationId: string) => {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.add(notificationId)
        return next
      })

      try {
        const response = await fetch(`/api/notifications?id=${encodeURIComponent(notificationId)}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await refreshNotifications({ force: true })
        }
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev)
          next.delete(notificationId)
          return next
        })
      }
    },
    [refreshNotifications]
  )

  const handleMarkAllAsRead = useCallback(async () => {
    setMarkAllLoading(true)
    try {
      await markAllAsRead()
    } finally {
      setMarkAllLoading(false)
    }
  }, [markAllAsRead])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [notificationsOpen])

  if (!session) return null

  return (
    <div className={`relative ${className}`} ref={notificationsRef}>
      <button
        onClick={handleNotificationsToggle}
        className="relative flex items-center justify-center p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 rounded-full hover:bg-slate-100"
        aria-label={'Bildirişlər'}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className={[
              'absolute -top-1 -right-1 bg-gradient-to-r from-amber-300 to-amber-500 text-blue-900 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg',
              badgePopping ? 'notification-badge-pop' : '',
            ].join(' ')}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {notificationsOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-md border border-blue-100 z-50 max-h-[32rem] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-blue-100 bg-slate-50 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900">{'Bildirişlər'}</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={markAllLoading}
                    className="text-xs text-blue-600 hover:text-blue-700 disabled:text-blue-400 font-medium transition-colors inline-flex items-center gap-1"
                  >
                    {markAllLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {'Hamısını oxunmuş kimi işarələ'}
                  </button>
                )}
                <Link
                  href={viewAllNotificationsPath}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  onClick={() => setNotificationsOpen(false)}
                >
                  {'Hamısına Bax'}
                </Link>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && notifications.length > 0 && (
              <div className="px-4 py-2 border-b border-blue-100 bg-blue-50/60">
                <div className="h-1.5 w-full rounded-full overflow-hidden bg-blue-100">
                  <div className="h-full w-1/3 bg-blue-500 notification-loading-bar" />
                </div>
              </div>
            )}

            {isLoading && notifications.length === 0 ? (
              <div className="px-4 py-4 space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-md border border-blue-100 p-3">
                    <div className="h-3 w-3/5 bg-slate-200 rounded animate-pulse" />
                    <div className="mt-2 h-2.5 w-4/5 bg-slate-100 rounded animate-pulse" />
                    <div className="mt-2 h-2.5 w-2/5 bg-slate-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500 select-none">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                  <Bell className="h-8 w-8 text-blue-300" />
                </div>
                <p className="text-sm font-semibold text-slate-700">{'Hələ bildiriş yoxdur'}</p>
                <p className="text-xs text-slate-400 mt-1">{'Yeni bildirişlər burada görünəcək'}</p>
              </div>
            ) : (
              <div>
                {visibleNotifications.map((notification) => (
                  <NotificationItemRow
                    key={notification._id}
                    notification={notification}
                    isHighlighted={highlightedIds.has(notification._id)}
                    isEntering={enteringIds.has(notification._id)}
                    isActionLoading={actionLoadingIds.has(notification._id)}
                    isDeleting={deletingIds.has(notification._id)}
                    onOpen={handleNotificationClick}
                    onToggleRead={handleToggleRead}
                    onDelete={handleDelete}
                    compact
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {visibleNotifications.length > 0 && (
            <div className="px-4 py-2 border-t border-blue-100 bg-slate-50 rounded-b-lg">
              <Link
                href={viewAllNotificationsPath}
                className="text-xs text-center text-blue-600 hover:text-blue-700 font-medium block transition-colors"
                onClick={() => setNotificationsOpen(false)}
              >
                {'Bütün bildirişlərə bax'}
              </Link>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .notification-enter {
          animation: notification-enter 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .notification-highlight {
          animation: notification-highlight 2.6s ease-out;
        }

        .notification-badge-pop {
          animation: notification-badge-pop 0.24s ease-out;
        }

        .notification-loading-bar {
          animation: notification-loading-slide 1.1s ease-in-out infinite;
        }

        @keyframes notification-enter {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes notification-highlight {
          0% {
            box-shadow: inset 0 0 0 999px rgba(253, 230, 138, 0.35);
          }
          100% {
            box-shadow: inset 0 0 0 999px rgba(253, 230, 138, 0);
          }
        }

        @keyframes notification-badge-pop {
          0% {
            transform: scale(0.85);
          }
          70% {
            transform: scale(1.15);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes notification-loading-slide {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(360%);
          }
        }
      `}</style>
    </div>
  )
}

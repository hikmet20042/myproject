'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useNotificationContext } from './NotificationContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSocket } from './SocketProvider'
import { useSSENotifications } from './SSENotificationProvider'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

interface Notification {
  _id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  type: string
  actionUrl?: string
}

interface NotificationBellProps {
  className?: string
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()
  const { lastNotification: sseNotification, isConnected: sseConnected } = useSSENotifications()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const { unreadCount, refreshNotifications } = useNotificationContext()
  const localePath = useLocalizedPath()
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Listen for SSE notifications
  useEffect(() => {
    if (sseNotification) {
      console.log('Received SSE notification in NotificationBell:', sseNotification)

      // Add to beginning of notifications list
      setNotifications(prev => [sseNotification, ...prev])

      // Refresh unread count
      refreshNotifications()
    }
  }, [sseNotification, refreshNotifications])

  // Listen for real-time notifications via Socket.IO or polling fallback
  useEffect(() => {
    if (!session?.user?.id) return

    if (socket && isConnected) {
      // Use Socket.IO for real-time updates
      console.log('Using Socket.IO for real-time notifications')

      // Handler for new notifications
      const handleNewNotification = (notification: any) => {
        console.log('Received real-time notification:', notification)

        // Add to beginning of notifications list
        setNotifications(prev => [{
          _id: notification.id,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          type: notification.type,
          actionUrl: notification.actionUrl
        }, ...prev])

        // Refresh unread count
        refreshNotifications()

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/logo.png',
            tag: notification.id
          })
        }
      }

      // Handler for notification updates (mark as read)
      const handleNotificationUpdate = (update: any) => {
        console.log('Received notification update:', update)
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === update.notificationId
              ? { ...notif, isRead: update.isRead }
              : notif
          )
        )
        refreshNotifications()
      }

      // Handler for bulk updates (mark all as read)
      const handleBulkUpdate = (update: any) => {
        console.log('Received bulk notification update')
        if (update.markAllAsRead) {
          setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })))
          refreshNotifications()
        }
      }

      // Register event listeners
      socket.on('notification', handleNewNotification)
      socket.on('notification:update', handleNotificationUpdate)
      socket.on('notification:bulk-update', handleBulkUpdate)

      // Request notification permission on first load
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }

      // Cleanup listeners on unmount
      return () => {
        socket.off('notification', handleNewNotification)
        socket.off('notification:update', handleNotificationUpdate)
        socket.off('notification:bulk-update', handleBulkUpdate)
      }
    } else {
      // Use polling as fallback when Socket.IO is not available (Vercel)
      console.log('Using polling fallback for notifications (Socket.IO unavailable)')

      // Poll for new notifications every 30 seconds
      const pollInterval = setInterval(() => {
        refreshNotifications()
      }, 30000) // 30 seconds

      return () => clearInterval(pollInterval)
    }
  }, [socket, isConnected, session?.user?.id, refreshNotifications])

  // Load notifications when dropdown opens
  const loadNotifications = async () => {
    if (!session?.user?.id) return
    setLoading(true)
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Toggle notification read status
  const toggleNotificationRead = async (notificationId: string, isRead: boolean) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead })
      })
      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId ? { ...notif, isRead } : notif
          )
        )
        // Refresh unread count
        refreshNotifications()
      }
    } catch (error) {
      console.error('Error updating notification:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead)
      await Promise.all(
        unreadNotifications.map(notif =>
          fetch(`/api/notifications/${notif._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true })
          })
        )
      )
      // Update local state
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })))
      // Refresh unread count
      refreshNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Handle notifications dropdown toggle
  const handleNotificationsToggle = () => {
    if (!notificationsOpen) {
      loadNotifications()
    }
    setNotificationsOpen(!notificationsOpen)
  }

  // Handle clicking on a notification
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      toggleNotificationRead(notification._id, true)
    }
    // Close dropdown
    setNotificationsOpen(false)

    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
  }

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return t('header.justNow')
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}${t('header.minutesAgo')}`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}${t('header.hoursAgo')}`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}${t('header.daysAgo')}`
    return date.toLocaleDateString()
  }

  // Get notification type label
  const getNotificationTypeLabel = (type: string) => {
    const typeKey = type.toUpperCase().replace('-', '_')
    return t(`notificationTypes.${typeKey}`) || type.replace('_', ' ').toUpperCase()
  }

  // Get notification icon based on type
  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'blog_like':
      case 'blog_dislike':
        return 'text-pink-600'
      case 'comment_reply':
      case 'comment_like':
      case 'comment_dislike':
        return 'text-blue-600'
      case 'event_deadline':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  // Close notifications when clicking outside
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
        className="relative flex items-center justify-center p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 rounded-full hover:bg-gray-100"
        aria-label={t('header.notifications')}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-300 to-yellow-500 text-blue-900 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {notificationsOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[32rem] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900">{t('header.notifications')}</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    {t('header.markAllRead') || 'Mark all read'}
                  </button>
                )}
                <Link href={localePath("/profile?tab=notifications")}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  onClick={() => setNotificationsOpen(false)}
                >
                  {t('header.viewAll')}
                </Link>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3 text-sm">{t('header.loading')}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-600">{t('header.noNotifications')}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {t('header.notificationsAppearHere') || "You'll be notified when something happens"}
                </p>
              </div>
            ) : (
              <div>
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification._id}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors ${!notification.isRead ? 'bg-blue-50/50' : ''
                      }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      {/* Content */}
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-2">
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                          )}
                          <div className="flex-1">
                            <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`text-xs font-medium ${getNotificationTypeColor(notification.type)}`}>
                                {getNotificationTypeLabel(notification.type)}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center flex-shrink-0">
                        {!notification.isRead ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleNotificationRead(notification._id, true)
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                            title={t('header.markAsRead')}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleNotificationRead(notification._id, false)
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title={t('header.markAsUnread')}
                          >
                            <CheckCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <Link href={localePath("/profile?tab=notifications")}
                className="text-xs text-center text-blue-600 hover:text-blue-700 font-medium block transition-colors"
                onClick={() => setNotificationsOpen(false)}
              >
                {t('header.viewAllNotifications') || 'View all notifications'}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

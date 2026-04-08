"use client"

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from '@/lib/auth/client'

export interface NotificationItem {
  id: string
  _id: string
  type: string
  title: string
  message: string
  actionUrl?: string
  data?: Record<string, any>
  isRead: boolean
  createdAt: string
}

export interface NotificationContextType {
  notifications: NotificationItem[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  refreshNotifications: (options?: { force?: boolean }) => Promise<void>
  ensureFreshNotifications: (maxAgeMs?: number) => Promise<void>
  toggleNotificationRead: (notificationId: string, isRead: boolean) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const noopAsync = async () => {}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  refreshNotifications: noopAsync,
  ensureFreshNotifications: noopAsync,
  toggleNotificationRead: noopAsync,
  markAllAsRead: noopAsync,
})

export const useNotificationContext = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastLoadedAtRef = useRef(0)

  const mapNotification = (raw: any): NotificationItem => ({
    id: raw.id,
    _id: raw.id,
    type: raw.type,
    title: raw.title,
    message: raw.message,
    actionUrl:
      raw.action_url ||
      raw.actionUrl ||
      (raw.related_item_id && raw.related_item_type
        ? raw.related_item_type === 'event'
          ? `/resources/events/${raw.related_item_id}`
          : raw.related_item_type === 'vacancy'
            ? `/resources/vacancies/${raw.related_item_id}`
            : `/blogs/${raw.related_item_id}`
        : undefined),
    data: raw.data || {},
    isRead: Boolean(raw.is_read ?? raw.isRead),
    createdAt: raw.created_at || raw.createdAt,
  })

  const normalizeNotificationsPayload = (responseJson: any) => {
    const payload = responseJson?.data || {}
    const items = Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.notifications)
        ? payload.notifications
        : []
    const metaFromPayload = payload.meta && typeof payload.meta === "object" ? payload.meta : {}
    const meta =
      typeof metaFromPayload.unreadCount === "number"
        ? metaFromPayload
        : {
            ...metaFromPayload,
            unreadCount:
              typeof payload.unreadCount === "number" ? payload.unreadCount : undefined,
          }

    return { items, meta }
  }

  const refreshNotifications = useCallback(async (options?: { force?: boolean }) => {
    if (!session?.user?.id) {
      setNotifications([])
      setUnreadCount(0)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/notifications', {
        cache: options?.force ? 'no-store' : 'default',
      })

      if (!response.ok) {
        throw new Error('Failed to load notifications')
      }

      const responseJson = await response.json()
      const normalized = normalizeNotificationsPayload(responseJson)
      const list = normalized.items.map(mapNotification)
      setNotifications(list)
      setUnreadCount(
        normalized.meta?.unreadCount ??
          list.filter((n: NotificationItem) => !n.isRead).length
      )
      lastLoadedAtRef.current = Date.now()
    } catch (err) {
      setError('Failed to load notifications')
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  const ensureFreshNotifications = useCallback(async (maxAgeMs = 30000) => {
    const now = Date.now()
    if (now - lastLoadedAtRef.current > maxAgeMs) {
      await refreshNotifications()
    }
  }, [refreshNotifications])

  const toggleNotificationRead = useCallback(async (notificationId: string, isRead: boolean) => {
    if (isRead) {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })
      if (!response.ok) {
        throw new Error('Failed to update notification')
      }
    } else {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, isRead }),
      })
      if (!response.ok) {
        throw new Error('Failed to update notification')
      }
    }

    await refreshNotifications({ force: true })
  }, [refreshNotifications])

  const markAllAsRead = useCallback(async () => {
    const response = await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllAsRead: true }),
    })

    if (!response.ok) {
      throw new Error('Failed to mark all as read')
    }

    await refreshNotifications({ force: true })
  }, [refreshNotifications])

  useEffect(() => {
    void refreshNotifications({ force: true })
  }, [refreshNotifications])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        refreshNotifications,
        ensureFreshNotifications,
        toggleNotificationRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

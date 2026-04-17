'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from '@/lib/auth/client'

const DEBUG_REALTIME = process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true'
const NOTIFICATION_PERMISSION_KEY = 'icma360_notification_permission_asked'

interface SSENotification {
  _id: string
  title: string
  message: string
  type: string
  actionUrl?: string
  isRead: boolean
  createdAt: string
}

interface SSEContextValue {
  isConnected: boolean
  lastNotification: SSENotification | null
}

const SSEContext = createContext<SSEContextValue>({
  isConnected: false,
  lastNotification: null
})

export const useSSENotifications = () => useContext(SSEContext)

export function SSENotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [enabled, setEnabled] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [lastNotification, setLastNotification] = useState<SSENotification | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const prevSessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setEnabled(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!enabled) return

    const currentSessionId = session?.user?.id

    // Handle session changes (login, logout, token refresh)
    if (prevSessionIdRef.current && prevSessionIdRef.current !== currentSessionId) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setIsConnected(false)
    }
    prevSessionIdRef.current = currentSessionId || null

    if (!currentSessionId) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setIsConnected(false)
      return
    }

    // Request notification permission only once
    const hasAskedBefore = localStorage.getItem(NOTIFICATION_PERMISSION_KEY)
    if (!hasAskedBefore && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission)
      })
    }

    const connectSSE = () => {
      try {
        const eventSource = new EventSource('/api/notifications/stream')
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          if (DEBUG_REALTIME) {
            console.log('SSE connected for real-time notifications')
          }
          setIsConnected(true)
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.type === 'connected') {
              if (DEBUG_REALTIME) {
                console.log('SSE connection established:', data.userId)
              }
            } else if (data.type === 'notification') {
              if (DEBUG_REALTIME) {
                console.log('New notification received via SSE:', data.notification)
              }
              setLastNotification(data.notification)
              
              if (Notification.permission === 'granted') {
                new Notification(data.notification.title, {
                  body: data.notification.message,
                  icon: '/icma360_logo.png',
                  tag: data.notification._id
                })
              }
            }
          } catch (error) {
            if (DEBUG_REALTIME) {
              console.error('Error parsing SSE message:', error)
            }
          }
        }

        eventSource.onerror = (error) => {
          if (DEBUG_REALTIME) {
            console.error('SSE connection error:', error)
          }
          setIsConnected(false)
          eventSource.close()
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (DEBUG_REALTIME) {
              console.log('Attempting to reconnect SSE...')
            }
            connectSSE()
          }, 5000)
        }
      } catch (error) {
        if (DEBUG_REALTIME) {
          console.error('Failed to create SSE connection:', error)
        }
      }
    }

    connectSSE()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [session?.user?.id, enabled])

  return (
    <SSEContext.Provider value={{ isConnected, lastNotification }}>
      {children}
    </SSEContext.Provider>
  )
}

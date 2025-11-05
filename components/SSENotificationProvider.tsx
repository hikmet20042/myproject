'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

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
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [lastNotification, setLastNotification] = useState<SSENotification | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!session?.user?.id) {
      // Cleanup if user logs out
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setIsConnected(false)
      return
    }

    // Create SSE connection
    const connectSSE = () => {
      try {
        const eventSource = new EventSource('/api/notifications/stream')
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          console.log('✅ SSE connected for real-time notifications')
          setIsConnected(true)
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.type === 'connected') {
              console.log('SSE connection established:', data.userId)
            } else if (data.type === 'notification') {
              console.log('📬 New notification received via SSE:', data.notification)
              setLastNotification(data.notification)
              
              // Show browser notification
              if (Notification.permission === 'granted') {
                new Notification(data.notification.title, {
                  body: data.notification.message,
                  icon: '/logo.png',
                  tag: data.notification._id
                })
              }
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error)
          }
        }

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error)
          setIsConnected(false)
          eventSource.close()
          
          // Attempt to reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect SSE...')
            connectSSE()
          }, 5000)
        }
      } catch (error) {
        console.error('Failed to create SSE connection:', error)
      }
    }

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Initial connection
    connectSSE()

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [session?.user?.id])

  return (
    <SSEContext.Provider value={{ isConnected, lastNotification }}>
      {children}
    </SSEContext.Provider>
  )
}

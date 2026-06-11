'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useSession } from '@/lib/auth/client'
import { io, Socket } from 'socket.io-client'

const DEBUG_REALTIME = process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true'

interface SocketContextValue {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false
})

export const useSocket = () => useContext(SocketContext)

// Check if Socket.IO should be enabled (disabled on Vercel production)
const isSocketEnabled = () => {
  // Keep websocket transport opt-in to avoid unnecessary homepage requests.
  return process.env.NEXT_PUBLIC_ENABLE_SOCKET === 'true'
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [enabled, setEnabled] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const isInitializingRef = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setEnabled(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!enabled || !session?.user?.id) {
      return
    }

    // Skip Socket.IO initialization on Vercel
    if (!isSocketEnabled()) {
      if (DEBUG_REALTIME) {
        console.log('Socket.IO disabled')
      }
      return
    }

    // Initialize Socket.IO connection
    const socketInitializer = async () => {
      // Prevent multiple initializations in Strict Mode
      if (isInitializingRef.current) return
      isInitializingRef.current = true

      try {
        // Fetch to initialize Socket.IO on server
        await fetch('/api/socket')

        // Check if we were unmounted while fetching
        if (!isInitializingRef.current) return

        // Connect to Socket.IO
        const newSocket = io({
          path: '/api/socket/io',
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 3,
          timeout: 5000
        })

        // Store in ref immediately for cleanup access
        socketRef.current = newSocket

        newSocket.on('connect', () => {
          if (DEBUG_REALTIME) {
            console.log('Socket.IO connected:', newSocket.id)
          }
          setIsConnected(true)

          // Join user-specific room if authenticated
          if (session?.user?.id) {
            newSocket.emit('join', session.user.id)
          }
        })

        newSocket.on('disconnect', () => {
          if (DEBUG_REALTIME) {
            console.log('Socket.IO disconnected')
          }
          setIsConnected(false)
        })

        newSocket.on('connect_error', (error) => {
          if (DEBUG_REALTIME) {
            console.error('Socket.IO connection error:', error.message)
          }
          setIsConnected(false)
        })

        setSocket(newSocket)
      } catch (error) {
        if (DEBUG_REALTIME) {
          console.error('Failed to initialize Socket.IO:', error)
        }
        isInitializingRef.current = false
      }
    }

    if (!socketRef.current) {
      socketInitializer()
    }

    // Cleanup on unmount
    return () => {
      isInitializingRef.current = false
      if (socketRef.current) {
        if (session?.user?.id) {
          socketRef.current.emit('leave', session.user.id)
        }
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
      }
    }
    // socketRef/setSocket are refs and state setters (stable refs) — not needed in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, session?.user?.id])

  // Join/leave room when session changes
  const prevUserIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!socket || !socket.connected) return
    const prevUserId = prevUserIdRef.current
    const nextUserId = session?.user?.id ?? null
    if (prevUserId && prevUserId !== nextUserId) {
      socket.emit('leave', prevUserId)
    }
    if (nextUserId) {
      socket.emit('join', nextUserId)
    }
    prevUserIdRef.current = nextUserId
  }, [session?.user?.id, socket])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

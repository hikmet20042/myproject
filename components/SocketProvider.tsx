'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

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
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_ENABLE_SOCKET === 'false') {
    return false
  }
  
  // Auto-disable on Vercel serverless environment (unless explicitly enabled)
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_VERCEL_ENV && process.env.NEXT_PUBLIC_ENABLE_SOCKET !== 'true') {
    return false
  }
  
  return true
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Skip Socket.IO initialization on Vercel
    if (!isSocketEnabled()) {
      console.log('Socket.IO disabled on Vercel serverless environment')
      return
    }

    // Initialize Socket.IO connection
    const socketInitializer = async () => {
      try {
        // Fetch to initialize Socket.IO on server
        await fetch('/api/socket')
        
        // Connect to Socket.IO
        const newSocket = io({
          path: '/api/socket/io',
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 3, // Reduced attempts
          timeout: 5000
        })

        newSocket.on('connect', () => {
          console.log('Socket.IO connected:', newSocket.id)
          setIsConnected(true)
          
          // Join user-specific room if authenticated
          if (session?.user?.id) {
            newSocket.emit('join', session.user.id)
          }
        })

        newSocket.on('disconnect', () => {
          console.log('Socket.IO disconnected')
          setIsConnected(false)
        })

        newSocket.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error.message)
          setIsConnected(false)
        })

        setSocket(newSocket)
      } catch (error) {
        console.error('Failed to initialize Socket.IO:', error)
      }
    }

    socketInitializer()

    // Cleanup on unmount
    return () => {
      if (socket) {
        if (session?.user?.id) {
          socket.emit('leave', session.user.id)
        }
        socket.disconnect()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]) // Removed socket from deps to run only once

  // Join/leave room when session changes
  useEffect(() => {
    if (socket && socket.connected) {
      if (session?.user?.id) {
        socket.emit('join', session.user.id)
      }
    }
  }, [session?.user?.id, socket])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

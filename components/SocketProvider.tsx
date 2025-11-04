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

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize Socket.IO connection
    const socketInitializer = async () => {
      // Fetch to initialize Socket.IO on server
      await fetch('/api/socket')
      
      // Connect to Socket.IO
      const newSocket = io({
        path: '/api/socket/io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
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
        console.error('Socket.IO connection error:', error)
        setIsConnected(false)
      })

      setSocket(newSocket)
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
  }, [session?.user.id,socket]) // Only run once on mount

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

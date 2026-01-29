import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiRequest } from 'next'
import { NextApiResponseServerIO } from '@/lib/socket'

export const config = {
  api: {
    bodyParser: false,
  },
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO...')
    
    const httpServer: NetServer = res.socket.server as any
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    })

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      // Join user-specific room
      socket.on('join', (userId: string) => {
        if (userId) {
          socket.join(`user:${userId}`)
          console.log(`User ${userId} joined their notification room`)
        }
      })

      // Leave user-specific room
      socket.on('leave', (userId: string) => {
        if (userId) {
          socket.leave(`user:${userId}`)
          console.log(`User ${userId} left their notification room`)
        }
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })

      socket.on('error', (error) => {
        console.error('Socket error:', error)
      })
    })

    res.socket.server.io = io
    console.log('Socket.IO initialized successfully')
  } else {
    console.log('Socket.IO already running')
  }
  
  res.end()
}

export default SocketHandler

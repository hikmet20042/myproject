import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiResponse } from 'next'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer
    }
  }
}

let io: SocketIOServer | undefined

export const initSocketIO = (server: NetServer): SocketIOServer => {
  if (!io) {
    console.log('Initializing Socket.IO server...')
    
    io = new SocketIOServer(server, {
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

    console.log('Socket.IO server initialized')
  }

  return io
}

export const getIO = (): SocketIOServer | undefined => {
  return io
}

// Emit notification to specific user
export const emitNotificationToUser = (userId: string, notification: any) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification)
    console.log(`Notification emitted to user ${userId}:`, notification.type)
  }
}

// Emit notification update (e.g., marked as read)
export const emitNotificationUpdate = (userId: string, notificationId: string, updates: any) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification:update', {
      notificationId,
      ...updates
    })
    console.log(`Notification update emitted to user ${userId}`)
  }
}

// Emit bulk notification update (e.g., mark all as read)
export const emitBulkNotificationUpdate = (userId: string, updates: any) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification:bulk-update', updates)
    console.log(`Bulk notification update emitted to user ${userId}`)
  }
}

// Emit comment events for real-time updates
export const emitNewComment = (blogId: string, comment: any) => {
  if (io) {
    io.emit('comment:new', { blogId, comment })
    console.log(`New comment event emitted for blog ${blogId}`)
  }
}

export const emitCommentUpdate = (blogId: string, commentId: string, updates: any) => {
  if (io) {
    io.emit('comment:update', { blogId, commentId, ...updates })
    console.log(`Comment update event emitted for blog ${blogId}`)
  }
}

export const emitCommentDelete = (blogId: string, commentId: string) => {
  if (io) {
    io.emit('comment:delete', { blogId, commentId })
    console.log(`Comment delete event emitted for blog ${blogId}`)
  }
}

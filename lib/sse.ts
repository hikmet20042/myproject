/**
 * Simple SSE (Server-Sent Events) connection manager
 *
 * ⚠️ IMPORTANT: In serverless/multi-instance environments:
 * - Each server instance has its own in-memory connection map
 * - SSE connections don't work across instance boundaries
 * - Socket.IO provides real-time fallback for these cases
 *
 * For production multi-instance deployments, consider:
 * 1. Redis + Redis Adapter for Socket.IO (recommended)
 * 2. Supabase Realtime for native PostgreSQL subscriptions
 * 3. Dedicated services like Pusher or Ably
 *
 * Current behavior:
 * - Single instance: SSE works perfectly as primary delivery method
 * - Multi-instance: Socket.IO fallback ensures notifications are delivered
 */

// In-memory connection map (per instance)
const connections: Map<string, ReadableStreamDefaultController> = new Map()

// Configuration from environment
const MAX_CONNECTIONS_PER_INSTANCE = parseInt(process.env.SSE_MAX_CONNECTIONS_PER_INSTANCE || '10000', 10) || 100
const MAX_CONNECTIONS_PER_USER = 2
const LOG_WARNINGS = process.env.SSE_LOG_WARNINGS !== 'false'

export const addConnection = (userId: string, controller: ReadableStreamDefaultController) => {
  // Check global connection limit
  if (connections.size >= MAX_CONNECTIONS_PER_INSTANCE) {
    if (LOG_WARNINGS) {
      console.warn(`[SSE] Connection limit reached on this instance (${connections.size}/${MAX_CONNECTIONS_PER_INSTANCE})`)
    }
    return false
  }

  // Close existing connection for this user before adding new one
  const existingController = connections.get(userId)
  if (existingController) {
    try {
      existingController.close()
    } catch {
      // Controller may already be closed
    }
  }

  connections.set(userId, controller)
  return true
}

export const removeConnection = (userId: string) => {
  const existed = connections.delete(userId)
  if (existed) {
    console.debug(`[SSE] Connection removed for user: ${userId} (Total: ${connections.size})`)
  }
  return existed
}

export const sendEventToUser = (userId: string, payload: any): boolean => {
  const controller = connections.get(userId)
  if (!controller) {
    // User not connected to this instance - normal in multi-instance setup
    return false
  }

  try {
    const encoder = new TextEncoder()
    const data = `data: ${JSON.stringify(payload)}\n\n`
    controller.enqueue(encoder.encode(data))
    return true
  } catch (err) {
    console.error(`[SSE] Failed to send event to user ${userId}:`, err)
    connections.delete(userId)
    return false
  }
}

export const hasConnection = (userId: string) => connections.has(userId)

export const getConnectionStats = () => ({
  activeConnections: connections.size,
  maxConnections: MAX_CONNECTIONS_PER_INSTANCE,
  utilizationPercent: Math.round((connections.size / MAX_CONNECTIONS_PER_INSTANCE) * 100),
})

// Wrapper for sending notifications to user (used by NotificationService)
export const sendNotificationToUser = async (userId: string, notification: any): Promise<boolean> => {
  try {
    // Returns false silently if user not connected to this instance
    // Socket.IO will handle delivery on the correct instance
    return sendEventToUser(userId, { type: 'notification', notification })
  } catch (err) {
    console.error('[SSE] sendNotificationToUser wrapper error:', err)
    return false
  }
}

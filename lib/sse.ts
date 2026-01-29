// Simple SSE connection manager
// Keep in mind: in serverless environments each instance keeps its own in-memory map.
// For multi-instance setups you'll need a pub/sub (Redis, Pusher, Ably, etc.).
const connections: Map<string, ReadableStreamDefaultController> = new Map()

export const addConnection = (userId: string, controller: ReadableStreamDefaultController) => {
  connections.set(userId, controller)
}

export const removeConnection = (userId: string) => {
  connections.delete(userId)
}

export const sendEventToUser = (userId: string, payload: any): boolean => {
  const controller = connections.get(userId)
  if (!controller) return false

  try {
    const encoder = new TextEncoder()
    const data = `data: ${JSON.stringify(payload)}\n\n`
    controller.enqueue(encoder.encode(data))
    return true
  } catch (err) {
    console.error('sse: failed to send event', err)
    connections.delete(userId)
    return false
  }
}

export const hasConnection = (userId: string) => connections.has(userId)

// Wrapper for sending notifications to user (used by NotificationService)
export const sendNotificationToUser = async (userId: string, notification: any): Promise<boolean> => {
  try {
    return sendEventToUser(userId, { type: 'notification', notification })
  } catch (err) {
    console.error('sendNotificationToUser wrapper error', err)
    return false
  }
}

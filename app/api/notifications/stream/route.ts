// Server-Sent Events (SSE) endpoint for real-time notifications
import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { addConnection, removeConnection } from '@/lib/sse'
import { applyRateLimit } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Connections are managed in lib/sse

export async function GET(request: NextRequest) {
  const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'authenticatedRead', endpoint: '/api/notifications/stream' })
  if (!rlResult.allowed) {
    return new Response('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', { status: 429, headers: rlHeaders })
  }

  const session = await getServerSession()
  
  if (!session?.user?.id) {
    return new Response('İcazəsiz giriş', { status: 401 })
  }

  const userId = session.user.id

  // Create SSE stream
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
  // Store connection
  addConnection(userId, controller)

      // Send initial connection message (no userId leak)
      const data = `data: ${JSON.stringify({ type: 'connected' })}\n\n`
      controller.enqueue(encoder.encode(data))

      // Keep-alive ping every 30 seconds
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'))
        } catch (error) {
          clearInterval(keepAliveInterval)
          removeConnection(userId)
        }
      }, 30000)

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAliveInterval)
        removeConnection(userId)
        try {
          controller.close()
        } catch (error) {
          // Already closed
        }
      })
    },
    cancel() {
      removeConnection(userId)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  })
}

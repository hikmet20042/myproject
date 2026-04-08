import { NextRequest } from 'next/server'
import { NotificationService } from '@/lib/services/notificationService'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

// This endpoint should be called by a cron job daily
export async function POST(request: NextRequest) {
  try {
    // Verify cron job authorization (use a secret key)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401)
    }
    
    const result = await NotificationService.checkEventDeadlinesAndNotify()
    
    return successResponse({
      status: 'completed',
      message: 'Event deadline notifications sent',
      usersChecked: result.usersChecked
    })
    
  } catch (error) {
    console.error('Cron job error:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}

// Manual trigger for testing (admin only)
export async function GET(request: NextRequest) {
  try {
    const result = await NotificationService.checkEventDeadlinesAndNotify()
    
    return successResponse({
      status: 'completed',
      message: 'Event deadline notifications sent (manual trigger)',
      usersChecked: result.usersChecked
    })
    
  } catch (error) {
    console.error('Manual trigger error:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}

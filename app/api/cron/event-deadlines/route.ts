import { NextRequest } from 'next/server'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

/**
 * Execute deadline notification with retry logic
 */
async function executeWithRetry(attempt = 1): Promise<any> {
  try {
    const result = await NotificationService.checkEventDeadlinesAndNotify()
    return result
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      console.warn(`Deadline check failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS}ms:`, error)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
      return executeWithRetry(attempt + 1)
    } else {
      throw error
    }
  }
}

// This endpoint should be called by a cron job daily
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verify cron job authorization (use a secret key)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron request - invalid or missing authorization header')
      return errorResponse('İcazəsiz giriş', "API_ERROR", {}, 401)
    }
    
    console.log('[Cron] Starting event deadline notification check...')
    const result = await executeWithRetry()
    const duration = Date.now() - startTime
    
    console.log(`[Cron] Event deadline notifications completed in ${duration}ms. Users checked: ${result.usersChecked}`)
    
    return successResponse({
      status: 'completed',
      message: 'Tədbir son tarix bildirişləri uğurla göndərildi',
      usersChecked: result.usersChecked,
      durationMs: duration
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[Cron] Event deadline check failed after ${duration}ms:`, error)
    
    return errorResponse(
      'Son tarix bildirişləri göndərilə bilmədi',
      "CRON_ERROR",
      {
        error: error instanceof Error ? error.message : String(error),
        durationMs: duration
      },
      500
    )
  }
}

// Manual trigger for testing (admin only - no auth check for now, protect with firewall)
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('[Manual] Starting event deadline notification check...')
    const result = await executeWithRetry()
    const duration = Date.now() - startTime
    
    console.log(`[Manual] Event deadline notifications completed in ${duration}ms. Users checked: ${result.usersChecked}`)
    
    return successResponse({
      status: 'completed',
      message: 'Tədbir son tarix bildirişləri göndərildi (manual trigger)',
      usersChecked: result.usersChecked,
      durationMs: duration
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[Manual] Event deadline check failed after ${duration}ms:`, error)
    
    return errorResponse(
      'Son tarix bildirişləri göndərilə bilmədi',
      "CHECK_FAILED",
      {
        error: error instanceof Error ? error.message : String(error),
        durationMs: duration
      },
      500
    )
  }
}

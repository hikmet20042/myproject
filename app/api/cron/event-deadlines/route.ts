import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/services/notificationService'
import dbConnect from '@/lib/mongoose'

export const dynamic = 'force-dynamic'

// This endpoint should be called by a cron job daily
export async function POST(request: NextRequest) {
  try {
    // Verify cron job authorization (use a secret key)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    await dbConnect()
    
    const result = await NotificationService.checkEventDeadlinesAndNotify()
    
    return NextResponse.json({
      status: 'completed',
      message: 'Event deadline notifications sent',
      usersChecked: result.usersChecked
    })
    
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Manual trigger for testing (admin only)
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const result = await NotificationService.checkEventDeadlinesAndNotify()
    
    return NextResponse.json({
      status: 'completed',
      message: 'Event deadline notifications sent (manual trigger)',
      usersChecked: result.usersChecked
    })
    
  } catch (error) {
    console.error('Manual trigger error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { processDraftInactivity, DEFAULT_INACTIVITY_CONFIG, findDraftsNeedingWarnings, findDraftsForDeletion } from '@/lib/services/draftManagementService';

export const dynamic = 'force-dynamic';

/**
 * Cron job endpoint for processing draft inactivity
 * This should be called periodically (e.g., daily) by a cron service
 * 
 * You can set this up with:
 * 1. Vercel Cron Jobs
 * 2. External cron services like cron-job.org
 * 3. GitHub Actions with scheduled workflows
 * 4. Server-side cron jobs
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    console.log('Starting draft inactivity processing...');
    const startTime = Date.now();

    // Process draft inactivity
    const result = await processDraftInactivity(DEFAULT_INACTIVITY_CONFIG);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('Draft inactivity processing completed:', {
      duration: `${duration}ms`,
      result
    });

    return NextResponse.json({
      success: true,
      message: 'Draft inactivity processing completed',
      duration,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Draft inactivity cron job error:', error);
    return NextResponse.json(
      { 
        error: 'Processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for manual testing and status checks
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dryRun') === 'true';

    if (dryRun) {
      // Dry run - show what would happen without actually doing it
      const [warningsResult, draftsForDeletion] = await Promise.all([
        findDraftsNeedingWarnings(DEFAULT_INACTIVITY_CONFIG),
        findDraftsForDeletion(DEFAULT_INACTIVITY_CONFIG)
      ]);

      if (!warningsResult.success) {
        return NextResponse.json(
          { error: 'Failed to find drafts needing warnings', details: warningsResult.error },
          { status: 500 }
        );
      }

      const draftsNeedingWarnings = warningsResult.results;

      return NextResponse.json({
        dryRun: true,
        config: DEFAULT_INACTIVITY_CONFIG,
        preview: {
          warningsToSend: draftsNeedingWarnings.length,
          draftsToMarkForDeletion: draftsForDeletion.length,
          warnings: draftsNeedingWarnings.map(({ draft, warningType, daysInactive }) => ({
            draftId: draft._id,
            title: draft.title,
            userId: draft.userId,
            warningType,
            daysInactive
          })),
          draftsForDeletion: draftsForDeletion.map(draft => ({
            draftId: draft._id,
            title: draft.title,
            userId: draft.userId,
            lastActivity: draft.draftMetadata?.lastActivity || draft.updatedAt
          }))
        },
        timestamp: new Date().toISOString()
      });
    }

    // Return current configuration and next run info
    return NextResponse.json({
      message: 'Draft inactivity cron job endpoint',
      config: DEFAULT_INACTIVITY_CONFIG,
      endpoints: {
        process: 'POST /api/cron/draft-inactivity',
        dryRun: 'GET /api/cron/draft-inactivity?dryRun=true'
      },
      setup: {
        cronSecret: process.env.CRON_SECRET ? 'configured' : 'not configured',
        recommendedSchedule: '0 2 * * *', // Daily at 2 AM
        vercelCron: 'Add to vercel.json: {"crons": [{"path": "/api/cron/draft-inactivity", "schedule": "0 2 * * *"}]}'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Draft inactivity cron status error:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}

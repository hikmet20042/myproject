import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { 
  processDraftInactivity, 
  DEFAULT_INACTIVITY_CONFIG,
  DraftInactivityConfig,
  findDraftsNeedingWarnings,
  findDraftsForDeletion
} from '@/lib/services/draftManagementService';

export const dynamic = 'force-dynamic';

// Process draft inactivity (admin only)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const User = require('@/lib/models/User').default;
    const user = await User.findById(session.user.id);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { config, dryRun = false } = body;

    // Use provided config or default
    const inactivityConfig: DraftInactivityConfig = {
      ...DEFAULT_INACTIVITY_CONFIG,
      ...config
    };

    if (dryRun) {
      // Dry run - just show what would happen
      const [warningsResult, draftsForDeletion] = await Promise.all([
        findDraftsNeedingWarnings(inactivityConfig),
        findDraftsForDeletion(inactivityConfig)
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
        config: inactivityConfig,
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
        }
      });
    }

    // Actually process the inactivity
    const result = await processDraftInactivity(inactivityConfig);

    return NextResponse.json({
      message: 'Draft inactivity processing completed',
      config: inactivityConfig,
      result
    });

  } catch (error) {
    console.error('Process draft inactivity error:', error);
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Get draft inactivity statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const User = require('@/lib/models/User').default;
    const user = await User.findById(session.user.id);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const Article = require('@/lib/models/Article').default;
    const now = new Date();
    const config = DEFAULT_INACTIVITY_CONFIG;

    // Calculate cutoff dates
    const firstWarningDate = new Date(now.getTime() - config.firstWarningDays * 24 * 60 * 60 * 1000);
    const secondWarningDate = new Date(now.getTime() - config.secondWarningDays * 24 * 60 * 60 * 1000);
    const finalWarningDate = new Date(now.getTime() - config.finalWarningDays * 24 * 60 * 60 * 1000);
    const deletionDate = new Date(now.getTime() - config.deletionDays * 24 * 60 * 60 * 1000);

    const [
      totalDrafts,
      activeDrafts,
      firstWarningDrafts,
      secondWarningDrafts,
      finalWarningDrafts,
      draftsForDeletion,
      markedForDeletion,
      expiredGracePeriod
    ] = await Promise.all([
      Article.countDocuments({ status: 'draft' }),
      Article.countDocuments({
        status: 'draft',
        'draftMetadata.lastActivity': { $gte: firstWarningDate }
      }),
      Article.countDocuments({
        status: 'draft',
        'draftMetadata.lastActivity': { $lt: firstWarningDate, $gte: secondWarningDate },
        'draftMetadata.inactivityWarningsSent': { $lt: 1 }
      }),
      Article.countDocuments({
        status: 'draft',
        'draftMetadata.lastActivity': { $lt: secondWarningDate, $gte: finalWarningDate },
        'draftMetadata.inactivityWarningsSent': { $lt: 2 }
      }),
      Article.countDocuments({
        status: 'draft',
        'draftMetadata.lastActivity': { $lt: finalWarningDate, $gte: deletionDate },
        'draftMetadata.inactivityWarningsSent': { $lt: 3 }
      }),
      Article.countDocuments({
        status: 'draft',
        'draftMetadata.lastActivity': { $lt: deletionDate },
        'draftMetadata.isMarkedForDeletion': { $ne: true }
      }),
      Article.countDocuments({
        status: 'draft',
        'draftMetadata.isMarkedForDeletion': true
      }),
      Article.countDocuments({
        status: 'draft',
        'draftMetadata.isMarkedForDeletion': true,
        'draftMetadata.scheduledDeletionDate': { $lt: now }
      })
    ]);

    return NextResponse.json({
      config,
      statistics: {
        totalDrafts,
        activeDrafts,
        inactivityBreakdown: {
          needingFirstWarning: firstWarningDrafts,
          needingSecondWarning: secondWarningDrafts,
          needingFinalWarning: finalWarningDrafts,
          readyForDeletion: draftsForDeletion
        },
        deletion: {
          markedForDeletion,
          expiredGracePeriod
        }
      },
      cutoffDates: {
        firstWarningDate,
        secondWarningDate,
        finalWarningDate,
        deletionDate
      }
    });

  } catch (error) {
    console.error('Draft inactivity statistics error:', error);
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}

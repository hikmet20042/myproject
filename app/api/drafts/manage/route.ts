import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Article from '@/lib/models/Article';
import {
  updateDraftActivity,
  getDraftDeletionStatus,
  recoverDraftFromDeletion,
  DEFAULT_INACTIVITY_CONFIG
} from '@/lib/services/draftManagementService';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// Get draft status and deletion information
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('draftId');

    if (draftId) {
      // Get specific draft status
      const draft = await Article.findOne({
        _id: draftId,
        userId: session.user.id,
        status: 'draft'
      });

      if (!draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }

      const deletionStatus = getDraftDeletionStatus(draft);
      
      return NextResponse.json({
        draft: {
          id: draft._id,
          title: draft.title,
          lastActivity: draft.draftMetadata?.lastActivity || draft.updatedAt,
          ...deletionStatus
        }
      });
    } else {
      // Get all user's drafts with deletion status
      const drafts = await Article.find({
        userId: session.user.id,
        status: 'draft'
      }).sort({ updatedAt: -1 });

      const draftsWithStatus = drafts.map(draft => {
        const deletionStatus = getDraftDeletionStatus(draft);
        return {
          id: draft._id,
          title: draft.title,
          lastActivity: draft.draftMetadata?.lastActivity || draft.updatedAt,
          updatedAt: draft.updatedAt,
          wordCount: draft.draftMetadata?.wordCount || 0,
          completionPercentage: draft.draftMetadata?.completionPercentage || 0,
          ...deletionStatus
        };
      });

      // Group by status
      const grouped = {
        active: draftsWithStatus.filter(d => d.status === 'active'),
        warning: draftsWithStatus.filter(d => d.status === 'warning'),
        finalWarning: draftsWithStatus.filter(d => d.status === 'final_warning'),
        markedForDeletion: draftsWithStatus.filter(d => d.status === 'marked_for_deletion')
      };

      return NextResponse.json({
        drafts: draftsWithStatus,
        grouped,
        summary: {
          total: draftsWithStatus.length,
          active: grouped.active.length,
          warning: grouped.warning.length,
          finalWarning: grouped.finalWarning.length,
          markedForDeletion: grouped.markedForDeletion.length
        },
        config: DEFAULT_INACTIVITY_CONFIG
      });
    }

  } catch (error) {
    console.error('Draft management GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update draft activity or recover from deletion
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, draftId } = body;

    if (!draftId || !mongoose.Types.ObjectId.isValid(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
    }

    switch (action) {
      case 'update_activity':
        const activityResult = await updateDraftActivity(draftId, session.user.id);
        if (!activityResult.success) {
          return NextResponse.json({ 
            error: 'Failed to update draft activity',
            details: activityResult.error 
          }, { status: 500 });
        }
        return NextResponse.json({ 
          message: 'Draft activity updated',
          timestamp: new Date()
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Draft management POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete draft immediately (user initiated)
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('draftId');

    if (!draftId || !mongoose.Types.ObjectId.isValid(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
    }

    // Find the draft first
    const draft = await Article.findOne({
      _id: draftId,
      userId: session.user.id,
      status: 'draft'
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Delete the draft permanently
    await Article.findByIdAndDelete(draft._id);

    return NextResponse.json({ 
      message: 'Draft deleted successfully',
      deletedDraft: {
        id: draft._id,
        title: draft.title
      }
    });

  } catch (error) {
    console.error('Draft deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

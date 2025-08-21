import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Article from '@/lib/models/Article';
import UserAnalytics from '@/lib/models/UserAnalytics';

export const dynamic = 'force-dynamic';

// Bulk delete operation for drafts
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { draftIds } = body;

    if (!draftIds || !Array.isArray(draftIds)) {
      return NextResponse.json({ error: 'Draft IDs array required' }, { status: 400 });
    }

    const query = { 
      _id: { $in: draftIds }, 
      userId: session.user.id, 
      status: 'draft' 
    };

    // Get the drafts before deletion to calculate total word count
    const draftsToDelete = await Article.find(query);
    const totalWordCountToSubtract = draftsToDelete.reduce((sum, draft) => {
      return sum + (draft.draftMetadata?.wordCount || 0);
    }, 0);

    const result = await Article.deleteMany(query);
    
    // Update user analytics to subtract deleted word counts
    if (result.deletedCount > 0) {
      try {
        await UserAnalytics.findOneAndUpdate(
          { userId: session.user.id },
          {
            $inc: {
              totalDrafts: -result.deletedCount,
              totalWordCount: -totalWordCountToSubtract
            },
            $set: {
              lastActiveDate: new Date(),
              lastCalculated: new Date()
            }
          },
          { upsert: true }
        );
      } catch (error) {
        console.error('Failed to update user analytics after bulk delete:', error);
      }
    }
    
    return NextResponse.json({ 
      message: `${result.deletedCount} drafts deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

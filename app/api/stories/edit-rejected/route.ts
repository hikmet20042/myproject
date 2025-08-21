import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Story from '@/lib/models/Story';
import NotificationModel from '@/lib/models/Notification';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storyId } = await request.json();
    
    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    // Find the rejected story
    const story = await Story.findById(storyId);
    
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check if the user owns this story
    const isOwner = (story.author && story.author.toString() === session.user.id) ||
    (story.authorName && story.authorName === session.user.name);
    
    if (!isOwner) {
      return NextResponse.json({ error: 'You can only edit your own stories' }, { status: 403 });
    }

    // Check if the story is rejected
    if (story.status !== 'rejected') {
      return NextResponse.json({ error: 'Only rejected stories can be converted to drafts' }, { status: 400 });
    }

    // Convert to draft and clear admin comment
    const updatedStory = await Story.findByIdAndUpdate(
      storyId,
      {
        $set: {
          status: 'draft',
          updatedAt: new Date()
        },
        $unset: {
          adminComment: 1
        }
      },
      { new: true }
    );

    // Create notification for successful conversion
    await NotificationModel.create({
      userId: session.user.id,
      type: 'story_draft_conversion',
      title: 'Story Converted to Draft',
      message: `Your rejected story "${story.title}" has been converted to a draft. You can now edit and resubmit it.`,
      data: {
        storyId: story._id,
        storyTitle: story.title
      }
    });

    return NextResponse.json({
      message: 'Story converted to draft successfully',
      story: updatedStory
    });
    
  } catch (error) {
    console.error('Edit rejected story error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
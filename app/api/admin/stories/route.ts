import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Story from '@/lib/models/Story';
import Notification from '@/lib/models/Notification';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

async function isAdmin(session: any) {
  return session?.user?.email === 'hikmat@mammadli.space' || session?.user?.role === 'admin';
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;
    const query: any = status ? { status } : {};
    const total = await Story.countDocuments(query);
    const stories = await Story.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    return NextResponse.json({ total, page, limit, results: stories });
  } catch (error) {
    console.error('GET /api/admin/stories error:', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const body = await request.json();
    const { id, status, adminComment } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    const story = await Story.findById(id);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }
    story.status = status;
    story.adminComment = adminComment || null;
    await story.save();

    // Send notification to author
    if (story.author) {
      const user = await User.findById(story.author);
      if (user) {
        await Notification.create({
          userId: user._id,
          type: 'story',
          title: `Your story was ${status}`,
          message: status === 'approved'
            ? `Congratulations! Your story "${story.title}" has been approved and published.`
            : `Your story "${story.title}" was rejected.${adminComment ? ' Reason: ' + adminComment : ''}`,
          data: { storyId: story._id, status },
        });
      }
    }
    return NextResponse.json({ message: `Story ${status} successfully` });
  } catch (error) {
    console.error('PUT /api/admin/stories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

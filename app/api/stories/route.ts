import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Story from '@/lib/models/Story';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags');
    const status = searchParams.get('status') || 'approved';
    const skip = (page - 1) * limit;

    const query: any = { status };
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { content: { $regex: search.trim(), $options: 'i' } }
      ];
    }
    if (tags && tags.trim()) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    const total = await Story.countDocuments(query);
    const stories = await Story.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      total,
      page,
      limit,
      results: stories
    });
  } catch (error) {
    console.error('GET /api/stories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    // Check email verification
    if (!('emailVerified' in session.user) || !session.user.emailVerified) {
      return NextResponse.json(
        { error: 'You must verify your email before submitting stories.' },
        { status: 403 }
      );
    }
    const body = await request.json();
  const { title, content, contentHtml, tags, abstract, isAnonymous } = body;
    if (!title || title.length < 5 || title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be between 5 and 200 characters' },
        { status: 400 }
      );
    }
    if (!content || content.length < 20) {
      return NextResponse.json(
        { error: 'Content must be at least 20 characters' },
        { status: 400 }
      );
    }
    const storyData = {
      title: title.trim(),
      content: typeof content === 'string' ? content.trim() : content,
      contentHtml: contentHtml || '',
      author: session.user.name || 'Anonymous',
      tags: tags || [],
      abstract: abstract || '',
      status: 'pending',
      isAnonymous: !!isAnonymous,
    };
    const story = await Story.create(storyData);
    return NextResponse.json({
      message: 'Story submitted',
      story
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/stories error:', error);
    return NextResponse.json(
      { error: 'Failed to submit story' },
      { status: 500 }
    );
  }
}

// PATCH/PUT for admin review (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    // Optionally: create notification for user here
    return NextResponse.json({ message: `Story ${status} successfully` });
  } catch (error) {
    console.error('PUT /api/stories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Article from '@/lib/models/Article';

export const dynamic = 'force-dynamic';

// Save or update a draft (article or story)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { draftId, title, content, category, tags, type } = body;
    if (!title && !content) {
      return NextResponse.json({ error: 'Draft must have at least a title or content' }, { status: 400 });
    }
    const draftData = {
      title: title || '',
      content: content || '',
      author: session.user.name || 'Unknown',
      category: category || type || 'other',
      tags: tags || [],
      status: 'draft',
      userId: session.user.id,
      updatedAt: new Date(),
    };
    let draft;
    if (draftId) {
      draft = await Article.findOneAndUpdate(
        { _id: draftId, userId: session.user.id },
        { $set: draftData },
        { new: true, upsert: true }
      );
    } else {
      draft = await Article.create({ ...draftData, createdAt: new Date() });
    }
    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Draft save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get all drafts for the logged-in user
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const drafts = await Article.find({ userId: session.user.id, status: 'draft' })
      .sort({ updatedAt: -1 })
      .lean();
    return NextResponse.json({ drafts });
  } catch (error) {
    console.error('Draft fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

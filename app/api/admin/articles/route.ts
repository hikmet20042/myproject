import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Article from '@/lib/models/Article';
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
    const total = await Article.countDocuments(query);
    const articles = await Article.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    return NextResponse.json({ total, page, limit, results: articles });
  } catch (error) {
    console.error('GET /api/admin/articles error:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
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
    const article = await Article.findById(id);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    article.status = status;
    article.adminComment = adminComment || null;
    await article.save();

    // Send notification to author
    if (article.author) {
      const user = await User.findById(article.author);
      if (user) {
        await Notification.create({
          userId: user._id,
          type: 'article',
          title: `Your article was ${status}`,
          message: status === 'approved'
            ? `Congratulations! Your article "${article.title}" has been approved and published.`
            : `Your article "${article.title}" was rejected.${adminComment ? ' Reason: ' + adminComment : ''}`,
          data: { articleId: article._id, status },
        });
      }
    }
    return NextResponse.json({ message: `Article ${status} successfully` });
  } catch (error) {
    console.error('PUT /api/admin/articles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

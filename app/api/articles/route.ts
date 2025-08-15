
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Article from '@/lib/models/Article';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      // Fetch by id, populate author name
      const article = await Article.findById(id).populate('author', 'name').lean();
      if (!article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      }
      return NextResponse.json({ article });
    }
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags');
    const category = searchParams.get('category');
  const status = searchParams.get('status') || 'approved';
    const skip = (page - 1) * limit;

    // Build query
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
    if (category && category !== 'all') {
      query.category = category;
    }

    const total = await Article.countDocuments(query);
    const articles = await Article.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name')
      .lean();

    return NextResponse.json({
      total,
      page,
      limit,
      results: articles
    });
  } catch (error) {
    console.error('GET /api/articles error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
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
    // Check email verification by fetching user from database
    const User = require('@/lib/models/User').default;
    const dbUser = await User.findOne({ email: session.user.email }).lean();
    if (!dbUser || !dbUser.emailVerified) {
      return NextResponse.json(
        { error: 'You must verify your email before submitting articles.' },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { title, content, contentHtml, category, author, anonymous, tags } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length < 5 || title.trim().length > 200) {
      return NextResponse.json(
        { error: 'Title must be between 5 and 200 characters.' },
        { status: 400 }
      );
    }
    if (!content || (typeof content === 'string' ? content.trim().length < 50 : true)) {
      return NextResponse.json(
        { error: 'Content must be at least 50 characters.' },
        { status: 400 }
      );
    }
    const validCategories = [
      'gender-violence',
      'discrimination',
      'workplace-equality',
      'education',
      'healthcare',
      'legal-rights',
      'workplace',
      'health',
      'politics',
      'social',
      'economic',
      'legal',
      'other'
    ];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category.' },
        { status: 400 }
      );
    }
    // Tags validation (optional, but must be array if present)
    if (tags && (!Array.isArray(tags) || tags.some((t: any) => typeof t !== 'string'))) {
      return NextResponse.json(
        { error: 'Tags must be an array of strings.' },
        { status: 400 }
      );
    }

    // Author logic: allow anonymous, else use provided or session name
    let finalAuthor = 'Anonymous';
    if (!anonymous) {
      if (author && typeof author === 'string' && author.trim().length > 0) {
        finalAuthor = author.trim();
      } else if (session.user.name && session.user.name.trim().length > 0) {
        finalAuthor = session.user.name.trim();
      } else {
        finalAuthor = 'Unknown';
      }
    }

    const articleData = {
      title: title.trim(),
      content: typeof content === 'string' ? content.trim() : content,
      contentHtml: contentHtml || '',
      category: category || 'other',
      author: finalAuthor,
      tags: tags || [],
      status: 'published',
      publishedAt: new Date(),
      views: 0,
      likes: 0
    };

    const article = await Article.create(articleData);
    return NextResponse.json(
      {
        message: 'Article submitted successfully.',
        article
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/articles error:', error);
    return NextResponse.json(
      { error: 'Failed to submit article.' },
      { status: 500 }
    );
  }
}

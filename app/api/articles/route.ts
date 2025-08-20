
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Article from '@/lib/models/Article';
import { processContentImages, updateMediaWithBlobReferences, getFeaturedImageBlobId, validateContentImages } from '@/lib/utils/imageUtils';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      // Fetch by id, handle author field safely
      const article = await Article.findById(id).lean() as any;
      if (!article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      }

      // Optimized: Always populate author in the initial query
      const populatedArticle = await Article.findById(id).populate('author', 'name').lean();
      return NextResponse.json({ article: populatedArticle || article });
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
    
    // Optimized: Use single populate query instead of individual queries
    const articles = await Article.find(query)
      .populate('author', 'name') // Populate author in single query
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // No need for individual population - already done in the query
    const processedArticles = articles;

    return NextResponse.json({
      total,
      page,
      limit,
      results: processedArticles
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
    const body = await request.json();
    const { id, title, content, abstract, category, author, anonymous, tags, references, status: reqStatus, media, featuredImage } = body;

    // Allow unauthenticated draft saves
    let session = null;
    let dbUser = null;
    let isDraft = reqStatus === 'draft';
    if (!isDraft) {
      session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      // Check email verification by fetching user from database
      const User = require('@/lib/models/User').default;
      dbUser = await User.findOne({ email: session.user.email }).lean();
      if (!dbUser || !dbUser.emailVerified) {
        return NextResponse.json(
          { error: 'You must verify your email before submitting articles.' },
          { status: 403 }
        );
      }
    }

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
      } else if (session && session.user.name && session.user.name.trim().length > 0) {
        finalAuthor = session.user.name.trim();
      } else {
        finalAuthor = 'Unknown';
      }
    }

    // Accept status from request, fallback to published for non-draft
    let statusToStore = isDraft ? 'draft' : (reqStatus === 'pending' ? 'pending' : 'approved');

    // Process content images and validate blob references
    const { processedContent, imageReferences } = processContentImages(content);

    // Validate that all blob images belong to the user (if authenticated)
    if (session?.user?.id && imageReferences.some(ref => ref.blobId)) {
      const validation = await validateContentImages(processedContent, session.user.id);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Some images in the content are invalid or do not belong to you.' },
          { status: 400 }
        );
      }
    }

    // Process media array with blob references
    const processedMedia = updateMediaWithBlobReferences(media);

    // Process featured image
    const featuredImageBlobId = getFeaturedImageBlobId(featuredImage);

    const articleData: any = {
      title: title.trim(),
      content: processedContent,
      abstract: abstract || '',
      category: category || 'other',
      author: finalAuthor,
      anonymous: anonymous || false,
      tags: tags || [],
      references: references || [],
      status: statusToStore,
      views: 0,
      likes: 0,
      media: processedMedia,
      featuredImage: featuredImage || undefined,
      featuredImageBlobId: featuredImageBlobId || undefined
    };
    // Attach userId if draft and session exists
    if (isDraft && session && session.user && session.user.id) {
      articleData.userId = session.user.id;
    }
    if (statusToStore === 'approved') {
      articleData.publishedAt = new Date();
    }

    let article;
    
    // If ID is provided, update existing article
    if (id) {
      article = await Article.findByIdAndUpdate(
        id,
        { $set: articleData },
        { new: true }
      );
      
      if (!article) {
        return NextResponse.json(
          { error: 'Draft not found' },
          { status: 404 }
        );
      }
    } else {
      // Create new article
      article = await Article.create(articleData);
    }
    return NextResponse.json(
      {
        message: isDraft ? 'Draft saved successfully.' : 'Article submitted successfully.',
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

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      title,
      content,
      abstract,
      category,
      tags,
      references,
      anonymous,
      author,
      status: reqStatus,
      media,
      featuredImage
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Article ID is required for updates' }, { status: 400 });
    }

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

    // Tags validation
    if (tags && (!Array.isArray(tags) || tags.some((t: any) => typeof t !== 'string'))) {
      return NextResponse.json(
        { error: 'Tags must be an array of strings.' },
        { status: 400 }
      );
    }

    // Author logic
    let finalAuthor = 'Anonymous';
    if (!anonymous) {
      if (author && typeof author === 'string' && author.trim().length > 0) {
        finalAuthor = author.trim();
      } else if (session && session.user.name && session.user.name.trim().length > 0) {
        finalAuthor = session.user.name.trim();
      } else {
        finalAuthor = 'Unknown';
      }
    }

    // Process content images and validate blob references
    const { processedContent, imageReferences } = processContentImages(content);

    // Validate that all blob images belong to the user
    if (imageReferences.some(ref => ref.blobId)) {
      const validation = await validateContentImages(processedContent, session.user.id);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Some images in the content are invalid or do not belong to you.' },
          { status: 400 }
        );
      }
    }

    // Process media array with blob references
    const processedMedia = updateMediaWithBlobReferences(media);

    // Process featured image
    const featuredImageBlobId = getFeaturedImageBlobId(featuredImage);

    const updateData: any = {
      title: title.trim(),
      content: processedContent,
      abstract: abstract || '',
      category: category || 'other',
      author: finalAuthor,
      anonymous: anonymous || false,
      tags: tags || [],
      references: references || [],
      media: processedMedia,
      featuredImage: featuredImage || undefined,
      featuredImageBlobId: featuredImageBlobId || undefined,
      updatedAt: new Date()
    };

    // Handle status updates
    if (reqStatus) {
      updateData.status = reqStatus;
      if (reqStatus === 'approved') {
        updateData.publishedAt = new Date();
      }
    }

    // Find the article first to check its current status
    const existingArticle = await Article.findOne({ _id: id, userId: session.user.id });
    
    if (!existingArticle) {
      return NextResponse.json({ error: 'Article not found or you do not have permission to edit it' }, { status: 404 });
    }

    // Prevent editing of approved articles
    if (existingArticle.status === 'approved') {
      return NextResponse.json({ 
        error: 'Approved articles cannot be edited. Contact an administrator if changes are needed.' 
      }, { status: 403 });
    }

    // If editing a rejected article, automatically change status to pending when submitting
    if (existingArticle.status === 'rejected' && reqStatus === 'pending') {
      updateData.adminComment = undefined; // Clear admin comment when resubmitting
    }

    const article = await Article.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({ article, message: 'Article updated successfully' });
  } catch (error) {
    console.error('Article update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
    }

    // Find the article and verify ownership
    const article = await Article.findById(id);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check if user owns this article (either by userId for drafts or by author for published articles)
    const isOwner = (article.userId && article.userId.toString() === session.user.id) ||
                   (article.author && article.author.toString() === session.user.id);

    if (!isOwner) {
      return NextResponse.json({ error: 'You can only delete your own articles' }, { status: 403 });
    }

    // Delete the article
    await Article.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/articles error:', error);
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}

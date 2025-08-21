import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Article from '@/lib/models/Article';
import NotificationModel from '@/lib/models/Notification';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { articleId } = await request.json();
    
    if (!articleId) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 });
    }

    // Find the rejected article
    const article = await Article.findById(articleId);
    
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check if the user owns this article
    const isOwner = (article.userId && article.userId.toString() === session.user.id) ||
                   (article.authorName && article.authorName === session.user.name);
    
    if (!isOwner) {
      return NextResponse.json({ error: 'You can only edit your own articles' }, { status: 403 });
    }

    // Check if the article is rejected
    if (article.status !== 'rejected') {
      return NextResponse.json({ error: 'Only rejected articles can be converted to drafts' }, { status: 400 });
    }

    // Convert to draft and clear admin comment
    const updatedArticle = await Article.findByIdAndUpdate(
      articleId,
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
      type: 'article_draft_conversion',
      title: 'Article Converted to Draft',
      message: `Your rejected article "${article.title}" has been converted to a draft. You can now edit and resubmit it.`,
      data: {
        articleId: article._id,
        articleTitle: article.title
      }
    });

    return NextResponse.json({
      message: 'Article converted to draft successfully',
      article: updatedArticle
    });
    
  } catch (error) {
    console.error('Edit rejected article error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
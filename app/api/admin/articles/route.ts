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
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const author = searchParams.get('author');
    const tags = searchParams.get('tags');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const skip = (page - 1) * limit;

    // Build query object
    const query: any = {};
    if (status) query.status = status;
    if (author) query.author = { $regex: author, $options: 'i' };
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { abstract: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const total = await Article.countDocuments(query);
    const articles = await Article.find(query).sort(sort).skip(skip).limit(limit).lean();
    
    // Get unique tags and authors for filtering
    const allTags = await Article.distinct('tags');
    const allAuthors = await Article.distinct('author');
    
    return NextResponse.json({ 
      total, 
      page, 
      limit, 
      results: articles,
      filters: {
        tags: allTags.filter(tag => tag),
        authors: allAuthors.filter(author => author)
      }
    });
  } catch (error) {
    console.error('GET /api/admin/articles error:', error);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, articleIds, status, adminComment } = body;

    if (!action || !articleIds || !Array.isArray(articleIds)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let updateData: any = {};
    let results: any[] = [];

    switch (action) {
      case 'bulk_approve':
        updateData = { status: 'approved', adminComment: adminComment || '' };
        break;
      case 'bulk_reject':
        updateData = { status: 'rejected', adminComment: adminComment || 'Bulk rejected' };
        break;
      case 'bulk_delete':
        // Soft delete by setting a deleted flag or actually delete
        await Article.deleteMany({ _id: { $in: articleIds } });
        return NextResponse.json({ 
          success: true, 
          message: `${articleIds.length} articles deleted successfully`,
          deletedCount: articleIds.length
        });
      case 'bulk_status_change':
        if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        updateData = { status, adminComment: adminComment || '' };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update articles and collect results
    for (const articleId of articleIds) {
      try {
        const article = await Article.findByIdAndUpdate(
          articleId,
          updateData,
          { new: true }
        );
        
        if (article) {
          results.push({ id: articleId, success: true, article });
          
          // Send notification to author if status changed
          if (updateData.status && article.author) {
            const user = await User.findOne({ 
              $or: [
                { email: article.author },
                { name: article.author }
              ]
            });
            
            if (user) {
              let notificationTitle, notificationMessage;
              
              if (updateData.status === 'rejected') {
                notificationTitle = 'Article Rejected';
                notificationMessage = `Your article "${article.title}" has been rejected.${updateData.adminComment ? ` Admin comment: ${updateData.adminComment}` : ''}`;
              } else if (updateData.status === 'approved') {
                notificationTitle = 'Article Approved';
                notificationMessage = `Congratulations! Your article "${article.title}" has been approved and published.`;
              } else {
                notificationTitle = `Article ${updateData.status}`;
                notificationMessage = `Your article "${article.title}" status has been changed to ${updateData.status}.${updateData.adminComment ? ` Admin comment: ${updateData.adminComment}` : ''}`;
              }
              
              await Notification.create({
                userId: user._id,
                type: 'article_status',
                title: notificationTitle,
                message: notificationMessage,
                isRead: false,
                data: {
                  articleId: article._id,
                  articleTitle: article.title,
                  status: updateData.status,
                  adminComment: updateData.adminComment
                }
              });
            }
          }
        } else {
          results.push({ id: articleId, success: false, error: 'Article not found' });
        }
      } catch (error) {
        results.push({ id: articleId, success: false, error: 'Update failed' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Bulk operation completed. ${successCount} successful, ${failureCount} failed.`,
      results,
      successCount,
      failureCount
    });

  } catch (error) {
    console.error('PATCH /api/admin/articles error:', error);
    return NextResponse.json({ error: 'Failed to perform bulk operation' }, { status: 500 });
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
    if (article.userId) {
      const user = await User.findById(article.userId);
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

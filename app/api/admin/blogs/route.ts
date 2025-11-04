import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Blog from '@/lib/models/Blog';
import User from '@/lib/models/User';
import Notification from '@/lib/models/Notification';
// Removed import of isAdmin - using local function instead
import { cache, invalidateUserCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

async function isAdmin(session: any) {
  return session?.user?.email === 'hikmat.mammadlii@gmail.com' || session?.user?.role === 'admin';
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

    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const skip = (page - 1) * limit;

    // Build query object
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (author) query.author = { $regex: author, $options: 'i' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { abstract: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },

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

    const total = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email _id') // Populate author with name, email, and _id
      .lean();
    
    // Get unique authors for filtering
    const allAuthors = await Blog.distinct('author');
    
    return NextResponse.json({ 
      total, 
      page, 
      limit, 
      results: blogs,
      filters: {
        authors: allAuthors.filter(author => author)
      }
    });
  } catch (error) {
    console.error('GET /api/admin/blogs error:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
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
    const blog = await Blog.findById(id);
    if (!blog) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }
    blog.status = status;
    blog.adminComment = adminComment || null;
    await blog.save();
    
    // Invalidate caches
    cache.blogs.invalidateAll();
    if (blog.author) {
      invalidateUserCache(blog.author.toString());
    }

    // Send notification to author
    if (blog.author) {
      const user = await User.findById(blog.author);
      if (user) {
        await Notification.create({
          userId: user._id,
          type: 'blog',
          title: `Your blog was ${status}`,
          message: status === 'approved'
            ? `Congratulations! Your blog "${blog.title}" has been approved and published.`
            : `Your blog "${blog.title}" was rejected.${adminComment ? ' Reason: ' + adminComment : ''}`,
          data: { blogId: blog._id, status },
        });
      }
    }
    return NextResponse.json({ message: `Blog ${status} successfully` });
  } catch (error) {
    console.error('PUT /api/admin/blogs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const { action, storyIds, status, adminComment } = body;

    if (!action || !storyIds || !Array.isArray(storyIds)) {
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
        await Blog.deleteMany({ _id: { $in: storyIds } });
        return NextResponse.json({ 
          success: true, 
          message: `${storyIds.length} blogs deleted successfully`,
          deletedCount: storyIds.length
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

    // Update blogs and collect results
    for (const storyId of storyIds) {
      try {
        const blog = await Blog.findByIdAndUpdate(
          storyId,
          updateData,
          { new: true }
        );
        
        if (blog) {
          results.push({ id: storyId, success: true, blog });
          
          // Send notification to author if status changed
          if (updateData.status && blog.author) {
            const user = await User.findById(blog.author);
            
            if (user) {
              await Notification.create({
                userId: user._id,
                type: 'blog_status',
                title: `Blog ${updateData.status}`,
                message: `Your blog "${blog.title}" has been ${updateData.status}.${updateData.adminComment ? ` Admin comment: ${updateData.adminComment}` : ''}`,
                read: false
              });
            }
          }
        } else {
          results.push({ id: storyId, success: false, error: 'Blog not found' });
        }
      } catch (error) {
        results.push({ id: storyId, success: false, error: 'Update failed' });
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
    console.error('PATCH /api/admin/blogs error:', error);
    return NextResponse.json({ error: 'Failed to perform bulk operation' }, { status: 500 });
  }
}

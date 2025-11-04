import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Comment from '@/lib/models/Comment'
import Blog from '@/lib/models/Blog'
import { NotificationService } from '@/lib/services/notificationService'
import { emitNewComment } from '@/lib/socket'

export const dynamic = 'force-dynamic'

// Get all comments for a blog
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const blogId = params.id;
    
    // Get all comments for this blog, sorted by creation date
    const comments = await Comment.find({ 
      blogId, 
      isDeleted: false 
    })
      .populate('authorId', 'name image')
      .sort({ createdAt: -1 })
      .lean();
    
    // Build a tree structure for nested comments
    const commentMap = new Map();
    const rootComments: any[] = [];
    
    // First pass: create map of all comments
    comments.forEach((comment: any) => {
      commentMap.set(comment._id.toString(), {
        ...comment,
        replies: []
      });
    });
    
    // Second pass: build tree structure
    comments.forEach((comment: any) => {
      const commentWithReplies = commentMap.get(comment._id.toString());
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId.toString());
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });
    
    return NextResponse.json({
      success: true,
      comments: rootComments,
      total: comments.length
    });
    
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const blogId = params.id;
    const { content, parentCommentId } = await request.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }
    
    if (content.length > 2000) {
      return NextResponse.json({ error: 'Comment is too long (max 2000 characters)' }, { status: 400 });
    }
    
    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    
    // Check if this is a reply and parent comment exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
    }
    
    // Check if commenter is the blog author
    const isAuthor = blog.author?.toString() === session.user.id;
    
    // Create the comment
    const comment = await Comment.create({
      blogId,
      authorId: session.user.id,
      authorName: session.user.name,
      content: content.trim(),
      parentCommentId: parentCommentId || null,
      isAuthor
    });
    
    await comment.populate('authorId', 'name image');
    
    // Notification logic with real-time Socket.IO
    const notifiedUsers = new Set<string>(); // Track who we've notified
    
    if (parentCommentId) {
      // This is a reply to another comment
      const parentComment = await Comment.findById(parentCommentId);
      
      if (parentComment) {
        // Notify the parent comment author (if not replying to yourself)
        if (parentComment.authorId.toString() !== session.user.id) {
          await NotificationService.createNotification({
            userId: parentComment.authorId.toString(),
            type: 'comment_reply',
            title: '💬 Someone replied to your comment',
            message: `${session.user.name} replied: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
            actionUrl: `/blogs/${blogId}#comment-${comment._id}`,
            data: {
              blogId,
              blogTitle: blog.title,
              commentId: comment._id,
              parentCommentId,
              authorId: session.user.id,
              authorName: session.user.name,
              content: content.substring(0, 100)
            }
          });
          notifiedUsers.add(parentComment.authorId.toString());
        }
        
        // Also notify the blog author (if different from reply author and parent comment author)
        if (
          blog.author && 
          blog.author.toString() !== session.user.id &&
          !notifiedUsers.has(blog.author.toString())
        ) {
          await NotificationService.createNotification({
            userId: blog.author.toString(),
            type: 'comment_reply',
            title: '💬 New reply on your blog',
            message: `${session.user.name} replied to a comment on "${blog.title}"`,
            actionUrl: `/blogs/${blogId}#comment-${comment._id}`,
            data: {
              blogId,
              blogTitle: blog.title,
              commentId: comment._id,
              parentCommentId,
              authorId: session.user.id,
              authorName: session.user.name,
              content: content.substring(0, 100)
            }
          });
        }
      }
    } else {
      // This is a top-level comment
      // Notify the blog author (if not commenting on own blog)
      if (blog.author && blog.author.toString() !== session.user.id) {
        await NotificationService.createNotification({
          userId: blog.author.toString(),
          type: 'comment_new',
          title: '💬 New comment on your blog',
          message: `${session.user.name} commented: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
          actionUrl: `/blogs/${blogId}#comment-${comment._id}`,
          data: {
            blogId,
            blogTitle: blog.title,
            commentId: comment._id,
            authorId: session.user.id,
            authorName: session.user.name,
            content: content.substring(0, 100)
          }
        });
      }
    }
    
    // Emit real-time event for new comment
    emitNewComment(blogId, {
      _id: comment._id,
      authorName: session.user.name,
      content: content.substring(0, 100),
      parentCommentId
    })
    
    return NextResponse.json({
      success: true,
      comment
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

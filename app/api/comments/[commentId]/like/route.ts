import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Comment from '@/lib/models/Comment'
import Blog from '@/lib/models/Blog'
import { NotificationService } from '@/lib/services/notificationService'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const commentId = params.commentId;
    const userId = session.user.id;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    
    // Check if user already liked this comment
    const hasLiked = comment.likedBy?.includes(userId);
    // Check if user has disliked this comment
    const hasDisliked = comment.dislikedBy?.includes(userId);
    
    let action: 'liked' | 'unliked';
    
    // If user disliked it, remove the dislike first
    if (hasDisliked) {
      comment.dislikedBy = comment.dislikedBy.filter((id: any) => id.toString() !== userId);
      comment.dislikes = Math.max(0, (comment.dislikes || 0) - 1);
    }
    
    if (hasLiked) {
      // Unlike the comment
      comment.likedBy = comment.likedBy.filter((id: any) => id.toString() !== userId);
      comment.likes = Math.max(0, (comment.likes || 0) - 1);
      action = 'unliked';
    } else {
      // Like the comment
      if (!comment.likedBy) comment.likedBy = [];
      comment.likedBy.push(userId);
      comment.likes = (comment.likes || 0) + 1;
      action = 'liked';
      
      // Create notification for comment author (if not liking own comment)
      if (comment.authorId.toString() !== userId) {
        // Get blog info for better notification
        const blog = await Blog.findById(comment.blogId).select('title');
        const blogTitle = blog?.title || 'a blog';
        
        // Get comment preview for context
        const commentPreview = comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : '');
        
        await NotificationService.createNotification({
          userId: comment.authorId.toString(),
          type: 'comment_like',
          title: '👍 Someone liked your comment',
          message: `${session.user.name} liked your comment on "${blogTitle}"`,
          actionUrl: `/blogs/${comment.blogId}#comment-${comment._id}`,
          data: {
            blogId: comment.blogId,
            blogTitle,
            commentId: comment._id,
            commentPreview,
            likedBy: userId,
            likedByName: session.user.name
          }
        });
      }
    }
    
    await comment.save();
    
    return NextResponse.json({
      success: true,
      action,
      likes: comment.likes,
      dislikes: comment.dislikes || 0,
      hasLiked: !hasLiked,
      hasDisliked: false
    });
    
  } catch (error) {
    console.error('Like/unlike comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

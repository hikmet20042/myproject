import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Comment from '@/lib/models/Comment'
import Notification from '@/lib/models/Notification'

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
    
    // Check if user already disliked this comment
    const hasDisliked = comment.dislikedBy?.includes(userId);
    // Check if user has liked this comment
    const hasLiked = comment.likedBy?.includes(userId);
    
    let action: 'disliked' | 'undisliked';
    
    // If user liked it, remove the like first
    if (hasLiked) {
      comment.likedBy = comment.likedBy.filter((id: any) => id.toString() !== userId);
      comment.likes = Math.max(0, (comment.likes || 0) - 1);
    }
    
    if (hasDisliked) {
      // Undislike the comment
      comment.dislikedBy = comment.dislikedBy.filter((id: any) => id.toString() !== userId);
      comment.dislikes = Math.max(0, (comment.dislikes || 0) - 1);
      action = 'undisliked';
    } else {
      // Dislike the comment
      if (!comment.dislikedBy) comment.dislikedBy = [];
      comment.dislikedBy.push(userId);
      comment.dislikes = (comment.dislikes || 0) + 1;
      action = 'disliked';
      
      // Create notification for comment author (if not disliking own comment)
      if (comment.authorId.toString() !== userId) {
        await Notification.create({
          userId: comment.authorId,
          type: 'comment_dislike',
          title: 'Someone disliked your comment',
          message: `${session.user.name} disliked your comment`,
          data: {
            blogId: comment.blogId,
            commentId: comment._id,
            dislikedBy: userId,
            dislikedByName: session.user.name
          },
          actionUrl: `/blogs/${comment.blogId}#comment-${comment._id}`
        });
      }
    }
    
    await comment.save();
    
    return NextResponse.json({
      success: true,
      action,
      likes: comment.likes || 0,
      dislikes: comment.dislikes,
      hasLiked: false,
      hasDisliked: !hasDisliked
    });
    
  } catch (error) {
    console.error('Dislike/undislike comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Comment from '@/lib/models/Comment'
import { emitCommentDelete, emitCommentUpdate } from '@/lib/socket'

export const dynamic = 'force-dynamic'

// Delete a comment
export async function DELETE(
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
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    
    // Only the comment author or admin can delete
    if (comment.authorId.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Soft delete the comment
    comment.isDeleted = true;
    comment.content = '[Comment deleted]';
    await comment.save();
    
    // Emit real-time event
    emitCommentDelete(comment.blogId.toString(), commentId)
    
    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update a comment
export async function PATCH(
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
    const { content } = await request.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }
    
    if (content.length > 2000) {
      return NextResponse.json({ error: 'Comment is too long (max 2000 characters)' }, { status: 400 });
    }
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    
    // Only the comment author can edit
    if (comment.authorId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    comment.content = content.trim();
    await comment.save();
    await comment.populate('authorId', 'name image');
    
    // Emit real-time event
    emitCommentUpdate(comment.blogId.toString(), commentId, {
      content: comment.content,
      updatedAt: comment.updatedAt
    })
    
    return NextResponse.json({
      success: true,
      comment
    });
    
  } catch (error) {
    console.error('Update comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

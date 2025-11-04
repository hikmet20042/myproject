'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import CommentForm from './CommentForm'
import CommentThread from './CommentThread'
import { MessageSquare } from 'lucide-react'
import { useSocket } from '../SocketProvider'

interface Comment {
  _id: string
  blogId: string
  authorId: {
    _id: string
    name: string
    image?: string
  }
  authorName: string
  content: string
  parentCommentId?: string | null
  likes: number
  likedBy: string[]
  dislikes: number
  dislikedBy: string[]
  isAuthor: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  replies: Comment[]
}

interface CommentSectionProps {
  blogId: string
  blogAuthorId: string
  className?: string
}

export default function CommentSection({
  blogId,
  blogAuthorId,
  className = ''
}: CommentSectionProps) {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalComments, setTotalComments] = useState(0)

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/blogs/${blogId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
        setTotalComments(data.total)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }, [blogId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // Real-time comment updates via Socket.IO
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleNewComment = (data: any) => {
      // Only refresh if comment is for this blog
      if (data.blogId === blogId) {
        console.log('New comment received for this blog')
        fetchComments()
      }
    }

    const handleCommentUpdate = (data: any) => {
      if (data.blogId === blogId) {
        console.log('Comment updated for this blog')
        fetchComments()
      }
    }

    const handleCommentDelete = (data: any) => {
      if (data.blogId === blogId) {
        console.log('Comment deleted for this blog')
        fetchComments()
      }
    }

    // Listen for comment events
    socket.on('comment:new', handleNewComment)
    socket.on('comment:update', handleCommentUpdate)
    socket.on('comment:delete', handleCommentDelete)

    return () => {
      socket.off('comment:new', handleNewComment)
      socket.off('comment:update', handleCommentUpdate)
      socket.off('comment:delete', handleCommentDelete)
    }
  }, [socket, isConnected, blogId,fetchComments])

  const handleCommentAdded = () => {
    fetchComments()
  }

  const handleCommentDeleted = () => {
    fetchComments()
  }

  const handleCommentUpdated = () => {
    fetchComments()
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/50 to-indigo-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Discussion
            </h3>
            <p className="text-xs text-gray-600">
              {totalComments} {totalComments === 1 ? 'comment' : 'comments'}
            </p>
          </div>
        </div>
      </div>

      {/* Comment Form */}
      <div className="px-6 py-5 border-b border-gray-100 bg-white">
        <CommentForm
          blogId={blogId}
          onCommentAdded={handleCommentAdded}
        />
      </div>

      {/* Comments List */}
      <div className="px-6 py-6 bg-white">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-base font-semibold text-gray-900 mb-1">No comments yet</p>
            <p className="text-sm text-gray-500">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentThread
                key={comment._id}
                comment={comment}
                blogId={blogId}
                blogAuthorId={blogAuthorId}
                onCommentDeleted={handleCommentDeleted}
                onCommentUpdated={handleCommentUpdated}
                onReplyAdded={handleCommentAdded}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

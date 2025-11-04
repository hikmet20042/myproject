'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { ThumbsUp, ThumbsDown, Reply, Trash2, Edit2, MoreVertical } from 'lucide-react'
import { Button } from '../ui/Button'
import CommentForm from './CommentForm'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'

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

interface CommentThreadProps {
  comment: Comment
  blogId: string
  blogAuthorId: string
  onCommentDeleted: () => void
  onCommentUpdated: () => void
  onReplyAdded: () => void
  depth?: number
}

export default function CommentThread({
  comment,
  blogId,
  blogAuthorId,
  onCommentDeleted,
  onCommentUpdated,
  onReplyAdded,
  depth = 0
}: CommentThreadProps) {
  const { t } = useLanguage()

  const { data: session } = useSession()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [likes, setLikes] = useState(comment.likes)
  const [dislikes, setDislikes] = useState(comment.dislikes)
  const [hasLiked, setHasLiked] = useState(
    comment.likedBy?.includes(session?.user?.id || '')
  )
  const [hasDisliked, setHasDisliked] = useState(
    comment.dislikedBy?.includes(session?.user?.id || '')
  )
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isHighlighted, setIsHighlighted] = useState(false)
  const commentRef = useRef<HTMLDivElement>(null)

  const isOwnComment = session?.user?.id === comment.authorId._id

  // Handle URL hash highlighting (Facebook-like behavior)
  useEffect(() => {
    const hash = window.location.hash
    const targetCommentId = `comment-${comment._id}`
    
    if (hash === `#${targetCommentId}`) {
      setIsHighlighted(true)
      
      // Scroll to comment with smooth behavior
      setTimeout(() => {
        commentRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 300)
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        setIsHighlighted(false)
      }, 3000)
    }
  }, [comment._id])

  const handleLike = async () => {
    if (!session?.user?.id) {
      alert('Please sign in to react')
      return
    }

    setIsActionLoading(true)
    try {
      const response = await fetch(`/api/comments/${comment._id}/like`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setLikes(data.likes)
        setDislikes(data.dislikes)
        setHasLiked(data.hasLiked)
        setHasDisliked(data.hasDisliked)
      }
    } catch (error) {
      console.error('Error liking comment:', error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDislike = async () => {
    if (!session?.user?.id) {
      alert('Please sign in to react')
      return
    }

    setIsActionLoading(true)
    try {
      const response = await fetch(`/api/comments/${comment._id}/dislike`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setLikes(data.likes)
        setDislikes(data.dislikes)
        setHasLiked(data.hasLiked)
        setHasDisliked(data.hasDisliked)
      }
    } catch (error) {
      console.error('Error disliking comment:', error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const response = await fetch(`/api/comments/${comment._id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onCommentDeleted()
      } else {
        alert('Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment')
    }
  }

  const handleUpdate = async () => {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`/api/comments/${comment._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() })
      })

      if (response.ok) {
        setIsEditing(false)
        onCommentUpdated()
      } else {
        alert('Failed to update comment')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      alert('Failed to update comment')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const maxDepth = 5
  const shouldIndent = depth < maxDepth

  return (
    <div 
      ref={commentRef}
      className={`${shouldIndent ? 'ml-8' : ''} transition-all duration-300 ${
        isHighlighted ? 'bg-blue-50 -mx-4 px-4 py-2 rounded-lg shadow-lg ring-2 ring-blue-500' : ''
      }`} 
      id={`comment-${comment._id}`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.authorId.image ? (
            <Image
              src={comment.authorId.image}
              alt={comment.authorName}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              {comment.authorName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className={`bg-gray-50 rounded-2xl px-4 py-2.5 ${
            isHighlighted ? 'bg-blue-100 ring-2 ring-blue-400' : ''
          }`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 text-sm hover:underline cursor-pointer">
                {comment.authorName}
              </span>
              
              {/* Author Badge */}
              {comment.isAuthor && (
                <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs font-medium rounded">
                  Author
                </span>
              )}

              {/* Actions Menu */}
              {(isOwnComment || session?.user?.role === 'admin') && (
                <div className="ml-auto relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>

                  {showMenu && (
                    <>
                      {/* Backdrop to close menu */}
                      <div 
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                        {isOwnComment && !comment.isDeleted && (
                          <button
                            onClick={() => {
                              setIsEditing(true)
                              setShowMenu(false)
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => {
                            handleDelete()
                            setShowMenu(false)
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            {isEditing ? (
              <div className="space-y-2 mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  maxLength={2000}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdate}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setEditContent(comment.content)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 text-sm whitespace-pre-wrap break-words leading-relaxed">
                {comment.content}
              </p>
            )}
          </div>

          {/* Meta info and Actions */}
          <div className="flex items-center gap-1 mt-1 ml-3">
            <span className="text-xs text-gray-500">
              {formatDate(comment.createdAt)}
            </span>
            
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-xs text-gray-400"> · Edited</span>
            )}
          </div>

          {/* Actions */}
          {!comment.isDeleted && (
            <div className="flex items-center gap-4 mt-1.5 ml-3">
              <button
                onClick={handleLike}
                disabled={isActionLoading}
                className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                  hasLiked ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                {likes > 0 && <span>{likes}</span>}
                <span className="ml-0.5">{t('titles.like')}</span>
              </button>

              <button
                onClick={handleDislike}
                disabled={isActionLoading}
                className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                  hasDisliked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                }`}
              >
                <ThumbsDown className={`w-3.5 h-3.5 ${hasDisliked ? 'fill-current' : ''}`} />
                {dislikes > 0 && <span>{dislikes}</span>}
              </button>

              {depth < maxDepth && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                  Reply
                </button>
              )}
            </div>
          )}

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-3">
              <CommentForm
                blogId={blogId}
                parentCommentId={comment._id}
                onCommentAdded={() => {
                  setShowReplyForm(false)
                  onReplyAdded()
                }}
                onCancel={() => setShowReplyForm(false)}
                placeholder={`Reply to ${comment.authorName}...`}
                autoFocus
              />
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentThread
                  key={reply._id}
                  comment={reply}
                  blogId={blogId}
                  blogAuthorId={blogAuthorId}
                  onCommentDeleted={onCommentDeleted}
                  onCommentUpdated={onCommentUpdated}
                  onReplyAdded={onReplyAdded}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

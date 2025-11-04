'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '../ui/Button'
import { Send } from 'lucide-react'
import Link from 'next/link'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

interface CommentFormProps {
  blogId: string
  parentCommentId?: string | null
  onCommentAdded: () => void
  onCancel?: () => void
  placeholder?: string
  autoFocus?: boolean
}

export default function CommentForm({
  blogId,
  parentCommentId = null,
  onCommentAdded,
  onCancel,
  placeholder = 'Share your thoughts...',
  autoFocus = false
}: CommentFormProps) {
  const { data: session } = useSession()
  const localePath = useLocalizedPath()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const maxLength = 2000

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id) {
      alert('Please sign in to comment')
      return
    }

    if (!content.trim()) {
      setError('Comment cannot be empty')
      return
    }

    if (content.length > maxLength) {
      setError(`Comment is too long (max ${maxLength} characters)`)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/blogs/${blogId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          parentCommentId
        })
      })

      if (response.ok) {
        setContent('')
        onCommentAdded()
        if (onCancel) onCancel()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to post comment')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      setError('Failed to post comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session?.user?.id) {
    return (
      <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-600 mb-3">
          Please sign in to join the conversation
        </p>
        <Link href={localePath('/auth/signin')}>
          <Button size="sm" variant="primary">
            Sign In
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={3}
          maxLength={maxLength}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
          {content.length}/{maxLength}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          size="sm"
          variant="primary"
          className="inline-flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Posting...' : parentCommentId ? 'Reply' : 'Comment'}
        </Button>

        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            size="sm"
            variant="outline"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

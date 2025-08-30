'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DOMPurify from 'dompurify'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Clock, Eye, User, Calendar, Tag, FileText, Heart, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const BlocknoteReadOnly = dynamic(() => import('@/components/BlocknoteReadOnly'), { ssr: false })

type Story = {
  _id: string
  title: string
  content: any
  contentHtml?: string
  abstract?: string
  author?: string
  authorName?: string
  isAnonymous?: boolean
  tags: string[]
  status: 'pending' | 'approved' | 'rejected'
  adminComment?: string
  createdAt: string
  updatedAt?: string
  publishedAt?: string
  submittedAt?: string
  views?: number
  likes?: number
  category?: string
}

export default function AdminStoryPreview({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [adminComment, setAdminComment] = useState('')
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const loadStory = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stories/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to load story')
      }
      
      const data = await response.json()
      setStory(data.story)
    } catch (error) {
      console.error('Error loading story:', error)
      setError('Failed to load story')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user || session.user.role !== 'admin') {
      router.push('/admin')
      return
    }

    loadStory()
  }, [loadStory, params.id, session, status, router])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading story preview...</div>
      </div>
    )
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Story not found</h1>
          <p className="text-gray-600 mb-4">{error || 'The story you were looking for doesn\'t exist.'}</p>
          <Link href="/admin" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Link>
        </div>
      </div>
    )
  }

  const handleAction = (type: 'approve' | 'reject') => {
    setActionType(type)
    setAdminComment(story?.adminComment || '')
    setShowModal(true)
  }

  const handleSubmitAction = async () => {
    if (!story || !actionType) return
    
    if (actionType === 'reject' && !adminComment.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    
    setIsProcessing(true)
    try {
      console.log('Sending request to:', `/api/admin/stories/${story._id}`)
      console.log('Request body:', {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        adminComment: adminComment.trim() || null
      })
      
      const response = await fetch(`/api/admin/stories/${story._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionType === 'approve' ? 'approved' : 'rejected',
          adminComment: adminComment.trim() || null
        })
      })
      
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (response.ok) {
        setStory(data.story)
        setShowModal(false)
        setActionType(null)
        setAdminComment('')
        alert(`Story ${actionType === 'approve' ? 'approved' : 'rejected'} successfully!`)
      } else {
        console.error('API Error:', data)
        alert(`Failed to update story status: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating story:', error)
      alert('An error occurred while updating the story')
    } finally {
      setIsProcessing(false)
    }
  }

  const publishedDate = story.publishedAt || story.submittedAt || story.createdAt
  const authorDisplay = story.isAnonymous ? 'Anonymous' : (story.authorName || 'Unknown Author')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/admin" 
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Dashboard
            </Link>
            <div className="flex items-center space-x-3">
              {getStatusBadge(story.status)}
              <span className="text-sm text-gray-500">Preview Mode</span>
              {/* Admin Actions */}
              {story.status === 'pending' && (
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleAction('approve')}
                    variant="primary"
                    size="sm"
                    className="inline-flex items-center text-xs"
                  >
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleAction('reject')}
                    variant="danger"
                    size="sm"
                    className="inline-flex items-center text-xs"
                  >
                    <ThumbsDown className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Story Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {story.title}
            </h1>
            
            {/* Story Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {authorDisplay}
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(publishedDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              {story.views !== undefined && (
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {story.views} views
                </div>
              )}
              {story.likes !== undefined && (
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  {story.likes} likes
                </div>
              )}
            </div>

            {/* Category */}
            {story.category && (
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {story.category}
                </span>
              </div>
            )}

            {/* Tags */}
            {story.tags && story.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {story.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Abstract */}
            {story.abstract && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Summary
                </h3>
                <p className="text-gray-700 leading-relaxed">{story.abstract}</p>
              </div>
            )}

            {/* Admin Comment */}
            {story.adminComment && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">Admin Comment</h3>
                <p className="text-red-700">{story.adminComment}</p>
              </div>
            )}
          </div>

          {/* Story Content */}
          <div className="px-6 py-8">
            <div className="prose max-w-none">
              {story.content && typeof story.content === 'object' ? (
                <BlocknoteReadOnly initialJSON={story.content} />
              ) : story.contentHtml ? (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(story.contentHtml) }} />
              ) : story.content && typeof story.content === 'string' ? (
                <div className="whitespace-pre-wrap leading-relaxed">{story.content}</div>
              ) : (
                <p className="text-gray-500 italic">No content available.</p>
              )}
            </div>
          </div>
        </article>
      </div>

      {/* Admin Action Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {actionType === 'approve' ? 'Approve Story' : 'Reject Story'}
                </h3>
                <Button
                  onClick={() => setShowModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionType === 'approve' ? 'Comment (optional)' : 'Reason for rejection (required)'}
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder={actionType === 'approve' ? 'Add a comment...' : 'Please explain why this story is being rejected...'}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowModal(false)}
                  variant="secondary"
                  size="sm"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitAction}
                  disabled={isProcessing}
                  variant={actionType === 'approve' ? 'primary' : 'danger'}
                  size="sm"
                >
                  {isProcessing ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
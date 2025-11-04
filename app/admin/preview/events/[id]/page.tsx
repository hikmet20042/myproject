'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { Calendar, MapPin, Users, Link as LinkIcon, Clock, Tag, ArrowLeft, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { LoadingState, ErrorState } from '@/components/shared'

interface Event {
  _id: string
  title: string
  description: string
  category: string
  eventType: 'event' | 'training' | 'workshop' | 'conference' | 'seminar'
  eventDate: string
  endDate?: string
  location: {
    type: 'online' | 'physical' | 'hybrid'
    address?: string
    city?: string
    country?: string
    onlineLink?: string
  }
  applicationLink?: string
  applicationDeadline?: string
  maxParticipants?: number
  currentParticipants: number
  tags: string[]
  imageUrl?: string
  createdBy: {
    _id: string
    name: string
  }
  organizationName?: string
  status: 'pending' | 'approved' | 'rejected'
  adminComment?: string
  approvedAt?: string
  approvedBy?: {
    _id: string
    name: string
  }
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  // Training-specific fields
  duration?: {
    value: number
    unit: 'hours' | 'days' | 'weeks'
  }
  schedule?: string
  prerequisites?: string[]
  learningOutcomes?: string[]
  certification?: {
    provided: boolean
    type?: string
    accreditedBy?: string
  }
  cost?: {
    amount: number
    currency: string
    scholarshipAvailable: boolean
  }
  targetAudience?: string[]
  syllabus?: {
    modules: Array<{
      title: string
      description: string
      duration: string
    }>
  }
}

export default function AdminEventPreview() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [adminComment, setAdminComment] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const localePath = useLocalizedPath()
  const fetchEvent = useCallback(async () => {
    if (!params?.id) {
      setError(t('admin.preview.events.notFound'))
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch(`/api/events/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data.event)
      } else {
        setError(t('admin.preview.events.fetchFailed'))
      }
    } catch (error) {
      setError(t('admin.preview.events.fetchError'))
    } finally {
      setLoading(false)
    }
  }, [params?.id, t])

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push(localePath("/"))
      return
    }
    fetchEvent()
  }, [fetchEvent, router, session, params?.id, localePath])

  const handleApprove = async () => {
    if (!params?.id) return
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/events/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve'
        })
      })

      if (response.ok) {
        router.push(localePath("/admin?tab=events"))
      } else {
        setError(t('admin.preview.events.approveFailed'))
      }
    } catch (error) {
      setError(t('admin.preview.events.approveError'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!params?.id) return
    
    if (!adminComment.trim()) {
      setError(t('admin.preview.events.rejectCommentRequired'))
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/events/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          adminComment
        })
      })

      if (response.ok) {
        router.push(localePath("/admin?tab=events"))
      } else {
        setError(t('admin.preview.events.rejectFailed'))
      }
    } catch (error) {
      setError(t('admin.preview.events.rejectError'))
    } finally {
      setActionLoading(false)
      setShowRejectModal(false)
    }
  }

  const formatEventType = (type: string) => {
    if (!type) return 'Event'
    // Convert 'workshop' to 'Workshop', 'training' to 'Training', etc.
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return t('admin.preview.notSpecified')
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return t('admin.preview.invalidDate')
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return t('admin.preview.notSpecified')
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return t('admin.preview.invalidDate')
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = () => {
    if (event?.status === 'rejected') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </span>
      )
    }
    if (event?.status === 'approved') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Pending Review
      </span>
    )
  }

  if (loading) {
    return <LoadingState text={t('admin.preview.events.loading') || 'Loading event preview...'} gradientFrom="from-purple-500" gradientVia="via-pink-500" gradientTo="to-red-500" />
  }

  if (error || !event) {
    return (
      <ErrorState 
        title={t('admin.preview.events.notFound') || 'Event Not Found'}
        message={error || t('admin.preview.events.notFoundMessage') || 'The event you are looking for could not be found.'}
        retryText={t('admin.preview.backToAdmin') || 'Back to Admin'}
        onRetry={() => router.push(localePath("/admin"))}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push(localePath("/admin?tab=events"))}
            variant="ghost"
            size="sm"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Panel
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                {getStatusBadge()}
                <span className="text-gray-500">by {event.organizationName || event.createdBy?.name || 'Unknown'}</span>
              </div>
            </div>
            
            {event.status === 'pending' && (
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  variant="outline"
                  size="md"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  variant="primary"
                  size="md"
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.preview.events.description')}</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* Tags */}
            {event.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.preview.events.tags')}</h3>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.preview.events.locationDetails')}</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">{t('admin.preview.events.type')}:</span>
                  <span className="ml-2 capitalize">{event.location.type}</span>
                </div>
                
                {event.location.type !== 'online' && (
                  <>
                    {event.location.address && (
                      <div>
                        <span className="font-medium text-gray-700">{t('admin.preview.events.address')}:</span>
                        <span className="ml-2">{event.location.address}</span>
                      </div>
                    )}
                    {event.location.city && (
                      <div>
                        <span className="font-medium text-gray-700">{t('admin.preview.events.city')}:</span>
                        <span className="ml-2">{event.location.city}</span>
                      </div>
                    )}
                    {event.location.country && (
                      <div>
                        <span className="font-medium text-gray-700">{t('admin.preview.events.country')}:</span>
                        <span className="ml-2">{event.location.country}</span>
                      </div>
                    )}
                  </>
                )}
                
                {(event.location.type === 'online' || event.location.type === 'hybrid') && event.location.onlineLink && (
                  <div>
                    <span className="font-medium text-gray-700">Online Link:</span>
                    <a
                      href={event.location.onlineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-800 inline-flex items-center"
                    >
                      {event.location.onlineLink}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Tag className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Event Type</p>
                    <p className="text-gray-600 text-sm">
                      {formatEventType(event.eventType)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Tag className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{t('category')}</p>
                    <p className="text-gray-600 text-sm">{event.category}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Event Date</p>
                    <p className="text-gray-600 text-sm">{formatDate(event.eventDate)}</p>
                  </div>
                </div>
                
                {event.endDate && (
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">End Date</p>
                      <p className="text-gray-600 text-sm">{formatDate(event.endDate)}</p>
                    </div>
                  </div>
                )}
                
                {event.applicationDeadline && (
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Application Deadline</p>
                      <p className="text-gray-600 text-sm">{formatDateTime(event.applicationDeadline)}</p>
                    </div>
                  </div>
                )}
                
                {event.maxParticipants && (
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{t('labels.capacity')}</p>
                      <p className="text-gray-600 text-sm">
                        {event.currentParticipants} / {event.maxParticipants} participants
                      </p>
                    </div>
                  </div>
                )}
                
                {event.applicationLink && (
                  <div className="flex items-start">
                    <LinkIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{t('titles.registration')}</p>
                      <a
                        href={event.applicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
                      >
                        Application Link
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Training-specific Details */}
            {(event.eventType === 'training' || event.eventType === 'workshop' || event.eventType === 'seminar') && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Details</h3>
                <div className="space-y-4">
                  {event.duration && (
                    <div className="flex items-start">
                      <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{t('titles.duration')}</p>
                        <p className="text-gray-600 text-sm">{event.duration.value} {event.duration.unit}</p>
                      </div>
                    </div>
                  )}
                  
                  {event.cost && (
                    <div className="flex items-start">
                      <Tag className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{t('titles.cost')}</p>
                        <p className="text-gray-600 text-sm">
                          {event.cost.amount > 0 ? `${event.cost.amount} ${event.cost.currency}` : 'Free'}
                          {event.cost.scholarshipAvailable && ' (Scholarships available)'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {event.certification?.provided && (
                    <div className="flex items-start">
                      <Tag className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{t('titles.certification')}</p>
                        <p className="text-gray-600 text-sm">
                          {event.certification.type}
                          {event.certification.accreditedBy && ` (by ${event.certification.accreditedBy})`}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {event.prerequisites && event.prerequisites.length > 0 && (
                    <div className="flex items-start">
                      <Tag className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{t('titles.prerequisites')}</p>
                        <ul className="text-gray-600 text-sm list-disc list-inside">
                          {event.prerequisites.map((prereq, index) => (
                            <li key={index}>{prereq}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {event.learningOutcomes && event.learningOutcomes.length > 0 && (
                    <div className="flex items-start">
                      <Tag className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Learning Outcomes</p>
                        <ul className="text-gray-600 text-sm list-disc list-inside">
                          {event.learningOutcomes.map((outcome, index) => (
                            <li key={index}>{outcome}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {event.targetAudience && event.targetAudience.length > 0 && (
                    <div className="flex items-start">
                      <Users className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Target Audience</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {event.targetAudience.map((audience, index) => (
                            <span key={index} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                              {audience}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {event.schedule && (
                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{t('titles.schedule')}</p>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{event.schedule}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">{t('buttons.created')}</span>
                  <span className="ml-2">{formatDateTime(event.createdAt)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Last Updated:</span>
                  <span className="ml-2">{formatDateTime(event.updatedAt)}</span>
                </div>
                {event.approvedAt && (
                  <div>
                    <span className="font-medium text-gray-700">{t('status.approved_1')}</span>
                    <span className="ml-2">{formatDateTime(event.approvedAt)}</span>
                  </div>
                )}
                {event.adminComment && (
                  <div>
                    <span className="font-medium text-gray-700">Admin Comment:</span>
                    <p className="mt-1 text-gray-600">{event.adminComment}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowRejectModal(false)
            setAdminComment('')
            setError('')
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Event</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this event:</p>
            <textarea
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
              placeholder="Enter admin comment..."
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowRejectModal(false)
                  setAdminComment('')
                  setError('')
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={actionLoading || !adminComment.trim()}
                variant="danger"
                size="sm"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Event'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
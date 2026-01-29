'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { Calendar, Clock, MapPin, Users, Link as LinkIcon, Tag, Edit, Trash2, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { LoadingState, ErrorState } from '@/components/shared'

interface Event {
  _id: string
  title: string
  description: string
  category: string
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
  isApproved: boolean
  approvedAt?: string
  approvedBy?: {
    name: string
  }
  rejectedAt?: string
  rejectionReason?: string
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  createdBy: {
    name: string
    organizationName?: string
  }
}

export default function EventDetail() {
  const { t, language } = useLanguage()
  const localePath = useLocalizedPath()
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadEvent = useCallback(async () => {
    try {
      setLoading(true)
      
  const response = await fetch(`/api/events/${params?.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setEvent(data.event)
      } else {
        setError(data.error || 'Failed to load event')
      }
    } catch (error) {
      console.error('Error loading event:', error)
      setError('Failed to load event')
    } finally {
      setLoading(false)
    }
  }, [params?.id])

  useEffect(() => {
    if (params?.id) {
      loadEvent()
    }
  }, [loadEvent, params?.id])

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const response = await fetch(`/api/events/${params?.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        router.push(localePath("/dashboard/events?deleted=true"))
      } else {
        const data = await response.json()
        alert('Failed to delete event: ' + data.error)
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = () => {
    if (!event) return null
    
    if (event.rejectedAt) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="w-4 h-4 mr-2" />
          {t('events.status.rejected')}
        </span>
      )
    }
    if (event.isApproved) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4 mr-2" />
          {t('events.status.approvedPublished')}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
        <AlertCircle className="w-4 h-4 mr-2" />
        {t('events.status.pendingReview')}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const opts: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    try {
      return new Date(dateString).toLocaleDateString(language || undefined, opts)
    } catch (e) {
      return new Date(dateString).toLocaleString()
    }
  }

  if (loading) {
    return <LoadingState text={t('events.loadingEvent') || 'Loading event...'} gradientFrom="from-blue-500" gradientVia="via-indigo-500" gradientTo="to-purple-500" />
  }

  if (error || !event) {
    return (
      <ErrorState 
        title={t('events.notFound') || 'Event Not Found'}
        message={error || t('events.notFoundMessage') || 'The event you are looking for could not be found.'}
        retryText={t('events.backToEvents') || 'Back to Events'}
        onRetry={() => router.push(localePath("/dashboard/events"))}
      />
    )
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Button
                onClick={() => router.push(localePath("/dashboard/events"))}
                variant="ghost"
                className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
              >
                ← {t('events.backToEvents') || 'Back to Events'}
              </Button>
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                {getStatusBadge()}
              </div>
              <p className="text-gray-600">{event.category}</p>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button
                onClick={() => router.push(localePath(`/dashboard/events/${event._id}/edit`))}
                variant="outline"
                icon={Edit}
                iconPosition="left"
                size="sm"
              >
                {t('events.editEvent')}
              </Button>
              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="danger"
                icon={Trash2}
                iconPosition="left"
                size="sm"
              >
                {t('events.deleteEvent')}
              </Button>
            </div>
          </div>
        </div>

        {/* Rejection Notice */}
        {event.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-red-900 mb-2">{t('events.rejectedTitle')}</h3>
            <p className="text-red-800">
              <strong>{t('events.rejectionReasonLabel')}:</strong> {event.rejectionReason}
            </p>
            <p className="text-red-700 mt-2 text-sm">
              {t('events.rejectedHelp')}
            </p>
          </div>
        )}

        {/* Event Image */}
        {event.imageUrl && (
          <div className="mb-8 relative h-64">
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover rounded-lg shadow-md"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('events.description')}</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* Tags */}
            {event.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location Details */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {t('events.locationLabel')}
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">{t('events.typeLabel')}:</span>
                  <span className="ml-2 capitalize">{event.location.type}</span>
                </div>
                
                {(event.location.type === 'physical' || event.location.type === 'hybrid') && (
                  <>
                    {event.location.address && (
                      <div>
                        <span className="font-medium text-gray-700">{t('events.address')}:</span>
                        <span className="ml-2">{event.location.address}</span>
                      </div>
                    )}
                    {event.location.city && (
                      <div>
                        <span className="font-medium text-gray-700">{t('labels.city_1')}</span>
                        <span className="ml-2">{event.location.city}</span>
                      </div>
                    )}
                    {event.location.country && (
                      <div>
                        <span className="font-medium text-gray-700">{t('labels.country_1')}</span>
                        <span className="ml-2">{event.location.country}</span>
                      </div>
                    )}
                  </>
                )}
                
                {(event.location.type === 'online' || event.location.type === 'hybrid') && event.location.onlineLink && (
                  <div>
                    <span className="font-medium text-gray-700">{t('events.onlineLink')}:</span>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('events.eventDetails')}</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{t('events.startDate')}</p>
                    <p className="text-gray-600 text-sm">{formatDate(event.eventDate)}</p>
                  </div>
                </div>
                
                {event.endDate && (
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{t('events.endDate')}</p>
                      <p className="text-gray-600 text-sm">{formatDate(event.endDate)}</p>
                    </div>
                  </div>
                )}
                
                {event.applicationDeadline && (
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{t('events.applicationDeadline')}</p>
                      <p className="text-gray-600 text-sm">{formatDate(event.applicationDeadline)}</p>
                    </div>
                  </div>
                )}
                
                {event.maxParticipants && (
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{t('events.capacity')}</p>
                      <p className="text-gray-600 text-sm">
                        {event.currentParticipants} / {event.maxParticipants} {t('events.participants')}
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

            {/* Status Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">{t('buttons.created')}</span>
                  <span className="ml-2">{new Date(event.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Last Updated:</span>
                  <span className="ml-2">{new Date(event.updatedAt).toLocaleDateString()}</span>
                </div>
                {event.approvedAt && (
                  <div>
                    <span className="font-medium text-gray-700">{t('status.approved_1')}</span>
                    <span className="ml-2">{new Date(event.approvedAt).toLocaleDateString()}</span>
                    {event.approvedBy && (
                      <p className="text-gray-600 text-xs mt-1">by {event.approvedBy.name}</p>
                    )}
                  </div>
                )}
                {event.rejectedAt && (
                  <div>
                    <span className="font-medium text-gray-700">{t('status.rejected_1')}</span>
                    <span className="ml-2">{new Date(event.rejectedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDeleteModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Event</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{event.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="outline"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                variant="danger"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Event'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Calendar, MapPin, Users, Link as LinkIcon, Clock, Tag, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { LoadingState, ErrorState } from '@/components/shared'

const eventCategories = [
  'workshop',
  'conference',
  'seminar',
  'art_performance',
  'cultural_event',
  'fundraising',
  'community_gathering',
  'awareness_campaign',
  'protest_rally',
  'educational_event',
  'networking',
  'celebration',
  'other'
]

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
  rejectedAt?: string
  rejectionReason?: string
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export default function EditEvent() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [event, setEvent] = useState<Event | null>(null)
  const [error, setError] = useState('')
  const localePath = useLocalizedPath()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    eventDate: '',
    endDate: '',
    location: {
      type: 'physical' as 'online' | 'physical' | 'hybrid',
      address: '',
      city: '',
      country: '',
      onlineLink: ''
    },
    applicationLink: '',
    applicationDeadline: '',
    maxParticipants: '',
    tags: '',
    imageUrl: ''
  })

  const { t } = useLanguage()

  const loadEvent = useCallback(async () => {
    try {
      setLoadingEvent(true)
      const response = await fetch(`/api/events/${params?.id}`)
      const data = await response.json()
      
      if (response.ok) {
        const eventData = data.event
        setEvent(eventData)
        setFormData({
          title: eventData.title || '',
          description: eventData.description || '',
          category: eventData.category || '',
          eventDate: eventData.eventDate ? new Date(eventData.eventDate).toISOString().slice(0, 16) : '',
          endDate: eventData.endDate ? new Date(eventData.endDate).toISOString().slice(0, 16) : '',
          location: {
            type: eventData.location?.type || 'physical',
            address: eventData.location?.address || '',
            city: eventData.location?.city || '',
            country: eventData.location?.country || '',
            onlineLink: eventData.location?.onlineLink || ''
          },
          applicationLink: eventData.applicationLink || '',
          applicationDeadline: eventData.applicationDeadline ? new Date(eventData.applicationDeadline).toISOString().slice(0, 16) : '',
          maxParticipants: eventData.maxParticipants?.toString() || '',
          tags: Array.isArray(eventData.tags) ? eventData.tags.join(', ') : '',
          imageUrl: eventData.imageUrl || ''
        })
      } else {
        setError(data.error || 'Failed to load event')
      }
    } catch (error) {
      console.error('Error loading event:', error)
      setError('Failed to load event')
    } finally {
      setLoadingEvent(false)
    }
  }, [params?.id])

  useEffect(() => {
    if (params?.id) {
      loadEvent()
    }
  }, [loadEvent, params?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare data
      const eventData = {
        ...formData,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        eventDate: new Date(formData.eventDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        applicationDeadline: formData.applicationDeadline ? new Date(formData.applicationDeadline).toISOString() : undefined
      }

      const response = await fetch(`/api/events/${params?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      })

      const data = await response.json()

      if (response.ok) {
        router.push(localePath("/dashboard/events?updated=true"))
      } else {
        alert('Error updating event: ' + data.error)
      }
    } catch (error) {
      console.error('Error updating event:', error)
      alert('Failed to update event')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  if (loadingEvent) {
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
          <h1 className="text-3xl font-bold text-gray-900">{t('events.editTitle')}</h1>
          <p className="mt-2 text-gray-600">
            {event.isApproved 
              ? t('events.editRequiresReapproval')
              : t('events.updateYourEventDetails')
            }
          </p>
          
          {event.rejectionReason && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                <strong>{t('events.previousRejectionReason')}</strong> {event.rejectionReason}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('events.basicInformation')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.eventTitle')} *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('events.eventTitlePlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.category')} *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('events.selectCategory')}</option>
                  {eventCategories.map(category => (
                    <option key={category} value={category}>{t(`events.categoryOptions.${category}`)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.maxParticipants')}
                </label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('events.maxParticipantsPlaceholder')}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.description')} *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  maxLength={2000}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('events.descriptionPlaceholder')}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.tags')}
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('events.tagsPlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {t('events.dateTime')}
              </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.startDate')} *
                </label>
                <input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.endDate')}
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.applicationDeadline')}
                </label>
                <input
                  type="datetime-local"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              {t('events.locationLabel')}
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.locationType')} *
                </label>
                <select
                  name="location.type"
                  value={formData.location.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="physical">{t('events.locationTypes.physical')}</option>
                  <option value="online">{t('events.locationTypes.online')}</option>
                  <option value="hybrid">{t('events.locationTypes.hybrid')}</option>
                </select>
              </div>
              
              {(formData.location.type === 'physical' || formData.location.type === 'hybrid') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('events.address')}
                    </label>
                    <input
                      type="text"
                      name="location.address"
                      value={formData.location.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('events.addressPlaceholder')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('events.city')}
                    </label>
                    <input
                      type="text"
                      name="location.city"
                      value={formData.location.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('events.cityPlaceholder')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('events.country')}
                    </label>
                    <input
                      type="text"
                      name="location.country"
                      value={formData.location.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('events.countryPlaceholder')}
                    />
                  </div>
                </div>
              )}
              
              {(formData.location.type === 'online' || formData.location.type === 'hybrid') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('events.onlineLink')}
                  </label>
                  <input
                    type="url"
                    name="location.onlineLink"
                    value={formData.location.onlineLink}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('events.onlineLinkPlaceholder')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('events.additionalInformation')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.applicationLink')}
                </label>
                <input
                  type="url"
                  name="applicationLink"
                  value={formData.applicationLink}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('events.urlPlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.imageUrl')}
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('events.urlPlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
            >
              {loading ? t('events.updating') : t('events.updateEvent')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
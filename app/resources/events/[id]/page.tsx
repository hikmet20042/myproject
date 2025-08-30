'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarIcon, MapPinIcon, UserGroupIcon, ClockIcon, LinkIcon, TagIcon } from '@heroicons/react/24/outline'
import { ArrowLeft, Calendar, MapPin, Users, Clock, ExternalLink, Tag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumb, ContactCard, Loading } from '@/components/ui'

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
  createdBy: {
    _id: string
    name: string
    ngoProfile?: {
      organizationName: string
    }
  }
  organizationName?: string
  isApproved: boolean
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchEvent(params.id as string)
    }
  }, [params.id])

  const fetchEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`)
      if (!response.ok) {
        throw new Error('Event not found')
      }
      const data = await response.json()
      setEvent(data.event)
    } catch (error) {
      console.error('Error fetching event:', error)
      setError('Failed to load event details')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date TBD'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid Date'
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Time TBD'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Time TBD'
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Not specified'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid Date'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Human Rights': 'bg-red-100 text-red-800',
      'Women Rights': 'bg-pink-100 text-pink-800',
      'Children Rights': 'bg-blue-100 text-blue-800',
      'Education': 'bg-green-100 text-green-800',
      'Healthcare': 'bg-purple-100 text-purple-800',
      'Environment': 'bg-emerald-100 text-emerald-800',
      'Poverty Alleviation': 'bg-orange-100 text-orange-800',
      'Legal Aid': 'bg-indigo-100 text-indigo-800',
      'Community Development': 'bg-yellow-100 text-yellow-800',
      'Youth Development': 'bg-cyan-100 text-cyan-800',
      'Elderly Care': 'bg-gray-100 text-gray-800',
      'Disability Rights': 'bg-violet-100 text-violet-800',
      'LGBTQ+ Rights': 'bg-rainbow-100 text-rainbow-800',
      'Mental Health': 'bg-teal-100 text-teal-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const isDeadlinePassed = (deadline: string) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loading size="xl" text="Loading event details..." />
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="shadow-lg max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The event you are looking for does not exist.'}</p>
            <Button
              onClick={() => router.back()}
              variant="primary"
              size="lg"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Events', href: '/resources/events' },
              { label: event.title, href: '#', current: true }
            ]}
          />
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Button>
        </div>

        {/* Header */}
        <Card className="shadow-lg mb-8">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <Badge variant="primary" className="text-sm">
                    {event.category}
                  </Badge>
                  <span>Organized by {event.createdBy?._id ? (
                    <Link 
                      href={`/resources/ngos/${event.createdBy._id}`}
                      className="text-primary hover:text-primary-dark transition-colors duration-200 hover:underline font-medium"
                    >
                      {event.organizationName || event.createdBy?.ngoProfile?.organizationName || event.createdBy?.name || 'Unknown'}
                    </Link>
                  ) : (
                    <span className="font-medium">{event.organizationName || event.createdBy?.ngoProfile?.organizationName || event.createdBy?.name || 'Unknown'}</span>
                  )}</span>
                </div>
              </div>
            </div>

            {event.imageUrl && (
              <div className="mb-6 relative h-80">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover rounded-xl"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Tag className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Event Description</h2>
                </div>
                <div className="prose max-w-none text-gray-700 leading-relaxed">
                  {event.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>

                {event.tags && event.tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Tag className="h-5 w-5 mr-2 text-primary" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-sm"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Event Details */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Event Details</h3>
                </div>
                <div className="space-y-6">
                  {/* Date & Time */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{formatDate(event.eventDate)}</p>
                      <p className="text-sm text-gray-600">{formatTime(event.eventDate)}</p>
                      {event.endDate && (
                        <p className="text-sm text-gray-600">Until: {formatDate(event.endDate)} at {formatTime(event.endDate)}</p>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 capitalize">{event.location.type}</p>
                      {event.location.type === 'physical' && event.location.address && (
                        <p className="text-sm text-gray-600">
                          {event.location.address}
                          {event.location.city && `, ${event.location.city}`}
                          {event.location.country && `, ${event.location.country}`}
                        </p>
                      )}
                      {(event.location.type === 'online' || event.location.type === 'hybrid') && event.location.onlineLink && (
                        <a
                          href={event.location.onlineLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:text-primary-dark underline"
                        >
                          Join Online
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Participants */}
                  {event.maxParticipants && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Participants</p>
                        <p className="text-sm text-gray-600">
                          {event.currentParticipants} / {event.maxParticipants} registered
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Application Deadline */}
                  {event.applicationDeadline && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Application Deadline</p>
                        <p className={`text-sm ${
                          isDeadlinePassed(event.applicationDeadline) 
                            ? 'text-red-600 font-medium' 
                            : 'text-gray-600'
                        }`}>
                          {formatDateTime(event.applicationDeadline)}
                          {isDeadlinePassed(event.applicationDeadline) && ' (Expired)'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Application Link */}
            {event.applicationLink && !isDeadlinePassed(event.applicationDeadline || '') && (
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Apply Now</h3>
                  </div>
                  <a
                    href={event.applicationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 text-white bg-gradient-to-r from-primary to-red-800 hover:from-red-700 hover:to-red-900 focus:ring-red-100 shadow-lg hover:shadow-xl border-2 border-transparent"
                  >
                    <ExternalLink className="h-5 w-5" />
                    Apply for Event
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Organizer Info */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Organized by</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">
                      {event.organizationName || event.createdBy?.ngoProfile?.organizationName || 'Unknown Organization'}
                    </p>
                    <p className="text-sm text-gray-600">Contact: {event.createdBy?.name}</p>
                  </div>
                  {event.createdBy?._id && (
                    <Link href={`/resources/ngos/${event.createdBy._id}`}>
                      <Button variant="outline" size="sm" className="mt-3">
                        View Organization Profile
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, MapPin, Users, Clock, ExternalLink, Tag, Sparkles, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumb, ContactCard, Loading } from '@/components/ui'
import SaveButton from '@/components/SaveButton'
import ViewTracker from '@/components/ViewTracker'
import { LoadingState, ErrorState, AnimatedBackground } from '@/components/shared'
import { useLanguage } from '@/contexts/LanguageContext'

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
  }
  organizationName?: string
  isApproved: boolean
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  views?: number
}

export default function EventDetailPage() {
  const { t } = useLanguage()

  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params?.id) {
      fetchEvent(params.id as string)
    }
  }, [params?.id])

  const fetchEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`)
      if (!response.ok) {
        throw new Error('Event not found')
      }
      const data = await response.json()
      setEvent({
        ...data.event,
        views: data.event.views || 0
      })
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
      <LoadingState
        text={t("events.loadingDetails") || "Loading event details..."}
        gradientFrom="from-blue-50"
        gradientVia="via-indigo-50"
        gradientTo="to-purple-100"
        spinnerColor="border-blue-500"
      />
    )
  }

  if (error || !event) {
    return (
      <ErrorState
        title={t("events.notFound") || "Event Not Found"}
        message={error || t('events.notFoundMessage') || 'The event you are looking for does not exist.'}
        onRetry={() => router.back()}
        retryText={t('events.goBack') || "Go Back"}
        gradientFrom="from-red-50"
        gradientVia="via-orange-50"
        gradientTo="to-yellow-50"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Animated Background */}
      <AnimatedBackground
        colors={{
          blob1: 'bg-blue-300',
          blob2: 'bg-indigo-300',
          blob3: 'bg-purple-300'
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 animate-fade-in">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Events', href: '/resources/events' },
              { label: event.title, href: '#', current: true }
            ]}
          />
        </div>

        {/* Back Button */}
        <div className="mb-6 animate-fade-in animation-delay-200">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 hover:scale-105 transition-transform border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('events.backTo')}
          </Button>
        </div>

        {/* View Tracker */}
        <ViewTracker itemId={event._id} itemType="event" />

        {/* Header Card with Hero Image */}
        <Card className="shadow-2xl mb-8 overflow-hidden border-2 border-blue-100 animate-scale-in">
          {event.imageUrl && (
            <div className="relative h-80 sm:h-96 lg:h-[28rem] overflow-hidden group">
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-indigo-900/50 to-transparent"></div>
              
              {/* Featured Badge */}
              {event.isFeatured && (
                <div className="absolute top-6 right-6 px-4 py-2 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-xl shadow-xl animate-pulse">
                  <span className="text-sm font-bold text-blue-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {t('events.featured')}
                  </span>
                </div>
              )}

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <Badge variant="primary" className="text-sm mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold shadow-lg">
                      {event.category}
                    </Badge>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 drop-shadow-lg">
                      {event.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                      <span className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 shadow-lg font-semibold">
                        <Users className="w-4 h-4" />
                        {t('events.organizedBy')} {event.createdBy?._id ? (
                          <Link 
                            href={`/resources/ngos/${event.createdBy._id}`}
                            className="text-white hover:text-yellow-300 transition-colors duration-200 hover:underline font-bold"
                          >
                            {event.organizationName || event.createdBy?.name || t('events.unknown')}
                          </Link>
                        ) : (
                          <span className="font-bold">{event.organizationName || event.createdBy?.name || t('events.unknown')}</span>
                        )}
                      </span>
                      <span className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 shadow-lg font-semibold">
                        <TrendingUp className="w-4 h-4" />
                        {event.views || 0} {t('events.views')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <SaveButton
                      itemId={event._id}
                      itemType="event"
                      itemTitle={event.title}
                      size="lg"
                      showText={false}
                      className="bg-white/20 backdrop-blur-md hover:bg-white/30 border-2 border-white/40 shadow-lg hover:scale-110 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {!event.imageUrl && (
            <CardContent className="p-6 sm:p-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge variant="primary" className="text-sm bg-white/20 backdrop-blur-md text-white border border-white/30 font-bold">
                      {event.category}
                    </Badge>
                    <span className="text-sm text-white/90 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {t('events.organizedBy')} {event.createdBy?._id ? (
                        <Link 
                          href={`/resources/ngos/${event.createdBy._id}`}
                          className="text-white hover:text-yellow-300 transition-colors duration-200 hover:underline font-bold"
                        >
                          {event.organizationName || event.createdBy?.name || t('events.unknown')}
                        </Link>
                      ) : (
                        <span className="font-bold">{event.organizationName || event.createdBy?.name || t('events.unknown')}</span>
                      )}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 drop-shadow-lg">{event.title}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <SaveButton
                    itemId={event._id}
                    itemType="event"
                    itemTitle={event.title}
                    size="lg"
                    showText={false}
                    className="bg-white/20 backdrop-blur-md hover:bg-white/30 border-2 border-white/40"
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card className="shadow-xl border-2 border-blue-100 animate-fade-in">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Tag className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">{t('events.eventDescription')}</h2>
                </div>
                <div className="prose max-w-none text-gray-700 leading-relaxed">
                  {event.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-base">{paragraph}</p>
                  ))}
                </div>

                {event.tags && event.tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t-2 border-blue-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                        <Tag className="h-4 w-4 text-white" />
                      </div>
                      {t('events.tags')}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {event.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-sm px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold rounded-xl border-2 border-blue-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                        >
                          #{tag}
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
            {/* {t('events.eventDetails')} */}
            <Card className="shadow-xl border-2 border-blue-100 animate-fade-in animation-delay-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">{t('events.eventDetails')}</h3>
                </div>
                <div className="space-y-5">
                  {/* View Count */}
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100">
                    <ViewTracker
                      itemId={event._id}
                      itemType="event"
                      initialViews={event.views || 0}
                      showCount={true}
                      className="w-full"
                    />
                  </div>

                  {/* {t('events.dateTime')} */}
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base">{formatDate(event.eventDate)}</p>
                      <p className="text-sm text-gray-600 font-medium">{formatTime(event.eventDate)}</p>
                      {event.endDate && (
                        <p className="text-sm text-gray-600 mt-1">{t('events.until')}: {formatDate(event.endDate)} at {formatTime(event.endDate)}</p>
                      )}
                    </div>
                  </div>

                  {/* {t('filters.location')} */}
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 capitalize text-base">{event.location.type}</p>
                      {event.location.type === 'physical' && event.location.address && (
                        <p className="text-sm text-gray-600 font-medium">
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
                          className="text-sm text-blue-600 hover:text-blue-700 underline font-semibold mt-1 inline-block"
                        >
                          {t('events.joinOnline')} →
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Participants */}
                  {event.maxParticipants && (
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-base">{t('titles.participants')}</p>
                        <p className="text-sm text-gray-600 font-medium">
                          {event.currentParticipants} / {event.maxParticipants} {t('events.registered')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* {t('events.applicationDeadline')} */}
                  {event.applicationDeadline && (
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                      <div className={`w-10 h-10 bg-gradient-to-br ${
                        isDeadlinePassed(event.applicationDeadline)
                          ? 'from-red-500 to-red-600'
                          : 'from-indigo-500 to-indigo-600'
                      } rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-base">{t('events.applicationDeadline')}</p>
                        <p className={`text-sm font-semibold ${
                          isDeadlinePassed(event.applicationDeadline) 
                            ? 'text-red-600' 
                            : 'text-gray-600'
                        }`}>
                          {formatDateTime(event.applicationDeadline)}
                          {isDeadlinePassed(event.applicationDeadline) && ` (${t('events.deadlinePassed')})`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Application Link */}
            {event.applicationLink && !isDeadlinePassed(event.applicationDeadline || '') && (
              <Card className="shadow-xl border-2 border-blue-100 animate-fade-in animation-delay-400">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">{t('events.applyNow')}</h3>
                  </div>
                  <a
                    href={event.applicationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-100 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <ExternalLink className="h-5 w-5" />
                    {t('events.applyNow')}
                  </a>
                </CardContent>
              </Card>
            )}

            {/* {t('events.organizer')} Info */}
            <Card className="shadow-xl border-2 border-blue-100 animate-fade-in animation-delay-600">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">Organized by</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100">
                    <p className="font-bold text-gray-900 text-lg">
                      {event.organizationName || 'Unknown Organization'}
                    </p>
                    <p className="text-sm text-gray-600 font-medium mt-1">Contact: {event.createdBy?.name}</p>
                  </div>
                  {event.createdBy?._id && (
                    <Link href={`/resources/ngos/${event.createdBy._id}`}>
                      <Button variant="outline" size="sm" className="w-full mt-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
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
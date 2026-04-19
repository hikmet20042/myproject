'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Users, Clock, ExternalLink, Tag, Sparkles, TrendingUp } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import SaveItemButtonContainer from '@/components/containers/SaveItemButtonContainer'
import ViewTracker from '@/components/ViewTracker'
import { LoadingState, ErrorState } from '@/components/shared'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { eventQueryKeys, fetchEventById } from '@/lib/eventQueries'
import { DetailPageLayout } from '@/components/layout'
import { EVENT_TYPE_LABELS, type EventTypeValue } from '@/lib/events/eventConfig'

interface Event { _id: string
  id: string
  slug: string
  status: string
  title: string
  description: string
  category: string
  eventDate: string
  endDate?: string
  location: { type: 'online' | 'physical' | 'hybrid'
    address?: string
    city?: string
    country?: string
    onlineLink?: string }
  applicationLink?: string
  applicationDeadline?: string
  eventType: string
  maxParticipants: number
  sessions?: Array<{
    date: string
    startTime: string
    endTime: string
  }>
  audienceAgeMin?: number
  audienceAgeMax?: number
  requirements?: string[]
  participantBenefits?: string[]
  certification?: {
    provided?: boolean
  }
  tags: string[]
  imageUrl?: string
  createdBy: { _id: string
    slug: string
    urlHandle?: string | null
    name: string
    email?: string }
  createdByOrganization?: { _id?: string
    id?: string
    slug?: string
    organizationName?: string
    email?: string }
  organizationName?: string
  isApproved: boolean
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  views?: number }

export default function EventDetailPage() { const localePath = useLocalizedPath()
  const { showError } = useGlobalFeedback()

  const params = useParams()
  const eventId = String(params?.slug || '')
  const eventQuery = useQuery({
    queryKey: eventQueryKeys.detail(eventId),
    queryFn: () => fetchEventById(eventId),
    enabled: !!eventId,
    retry: false
  })
  const event = eventQuery.data as Event | undefined

  useEffect(() => {
    if (eventQuery.isError) {
      showError(eventQuery.error instanceof Error ? eventQuery.error.message : 'Tədbir yüklənmədi')
    }
  }, [eventQuery.isError, eventQuery.error, showError])

  const formatDate = (dateString: string) => { if (!dateString) return 'Tarix müəyyən deyil'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Etibarsız tarix'
    return date.toLocaleDateString('az-AZ', { weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric' }) }

  const formatTime = (dateString: string) => { if (!dateString) return 'Vaxt müəyyən deyil'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Vaxt müəyyən deyil'
    return date.toLocaleTimeString('az-AZ', { hour: '2-digit',
      minute: '2-digit' }) }

  const formatDateTime = (dateString: string) => { if (!dateString) return 'Məlumat yoxdur'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Etibarsız tarix'
    return date.toLocaleDateString('az-AZ', { year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit' }) }

  const slugifyCategory = (s: string) =>
    s
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');

  const getCategoryLabel = (val: string) => {
    const labels: Record<string, string> = {
      'Human Rights': 'İnsan hüquqları',
      'Women Rights': 'Qadın hüquqları',
      'Children Rights': 'Uşaq hüquqları',
      'Education': 'Təhsil',
      'Healthcare': 'Səhiyyə',
      'Environment': 'Ətraf mühit',
      'Poverty Alleviation': 'Yoxsulluğun azaldılması',
      'Legal Aid': 'Hüquqi yardım',
      'Community Development': 'İcmanın inkişafı',
      'Youth Development': 'Gənclərin inkişafı',
      'Elderly Care': 'Yaşlılara qayğı',
      'Disability Rights': 'Əlillik hüquqları',
      'LGBTQ+ Rights': 'LGBTQ+ hüquqları',
      'Mental Health': 'Psixi sağlamlıq'
    }
    return labels[val] || val
  };

  const getLocationTypeLabel = (type: string) => {
    if (type === 'online') return 'Onlayn'
    if (type === 'physical') return 'Fiziki'
    if (type === 'hybrid') return 'Hibrid'
    return type
  }

  const getEventTypeLabel = (type: string) => {
    if (!type) return 'Tədbir'
    return EVENT_TYPE_LABELS[type as EventTypeValue] || type
  }

    const getCategoryColor = (category: string) => { const colors: { [key: string]: string } = { 'Human Rights': 'bg-red-100 text-red-800',
      'Women Rights': 'bg-blue-100 text-blue-800',
      'Children Rights': 'bg-blue-100 text-blue-800',
      'Education': 'bg-green-100 text-green-800',
      'Healthcare': 'bg-cyan-100 text-cyan-800',
      'Environment': 'bg-emerald-100 text-emerald-800',
      'Poverty Alleviation': 'bg-orange-100 text-orange-800',
      'Legal Aid': 'bg-sky-100 text-sky-800',
      'Community Development': 'bg-yellow-100 text-yellow-800',
      'Youth Development': 'bg-cyan-100 text-cyan-800',
      'Elderly Care': 'bg-gray-100 text-gray-800',
      'Disability Rights': 'bg-teal-100 text-teal-800',
      'LGBTQ+ Rights': 'bg-rainbow-100 text-rainbow-800',
      'Mental Health': 'bg-teal-100 text-teal-800' }
    return colors[category] || 'bg-gray-100 text-gray-800' }

  const isDeadlinePassed = (deadline: string) => { if (!deadline) return false
    return new Date(deadline) < new Date() }
  const hasActiveApplicationLink = !!event?.applicationLink

  if (eventQuery.isLoading) { return (
      <LoadingState
        text={'Tədbir təfərrüatları yüklənir...'}
      />
    ) }

  if (eventQuery.isError || !event) { return (
      <ErrorState
        title={'Tədbir tapılmadı'}
        message={eventQuery.error instanceof Error ? eventQuery.error.message : 'Axtardığın tədbir mövcud deyil.'}
        onRetry={() => eventQuery.refetch()}
        retryText={'Yenidən cəhd et'}
        gradientFrom="from-red-50"
        gradientVia="via-orange-50"
        gradientTo="to-yellow-50"
      />
    ) }

  return (
    <>
      {event.status === 'approved' && (
        <ViewTracker itemType="event" itemId={event.slug} minTimeMs={10000} selector="#event-content" />
      )}
      <DetailPageLayout
      backHref={localePath('/resources/events')}
      backLabel={'Tədbirlərə qayıt'}
      breadcrumbItems={[
        { label: 'Ana Səhifə', href: localePath('/') },
        { label: 'Tədbirlər', href: localePath('/resources/events') },
        { label: event.title, current: true },
      ]}
      title={event.title}
      metadata={
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700 sm:text-base">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
            <Tag className="h-4 w-4 text-primary" />
            <span className="font-medium">{getCategoryLabel(event.category)}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium">{event.organizationName || event.createdBy?.name || 'Naməlum'}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
            <Calendar className="h-4 w-4 text-accent" />
            <span className="font-medium">{formatDate(event.eventDate)}</span>
          </div>
        </div>
      }
      mainContent={
        <>
          <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
          {event.imageUrl && (
            <div className="relative h-80 sm:h-96 lg:h-[28rem] overflow-hidden group">
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/45 to-transparent"></div>
              
              {event.isFeatured && (
                <div className="absolute top-6 right-6 rounded-xl border border-yellow-300 bg-yellow-100/95 px-4 py-2 shadow-lg">
                  <span className="flex items-center gap-2 text-sm font-bold text-yellow-900">
                    <Sparkles className="w-4 h-4" />
                    {'Seçilmiş'}
                  </span>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <Badge variant="primary" className="mb-3 border border-white/30 bg-white/20 text-sm font-bold backdrop-blur-md">
                      {getCategoryLabel(event.category)}
                    </Badge>
                    <h1 className="mb-3 text-3xl font-black text-white drop-shadow-lg sm:text-4xl lg:text-5xl">
                      {event.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                      {(() => {
                        const organizationHandle = event.createdByOrganization?.urlHandle || event.createdByOrganization?.slug
                        const organizationLabel = event.organizationName || event.createdByOrganization?.organizationName || event.createdBy?.name || 'Naməlum'
                        return (
                      <span className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-4 py-2 font-semibold backdrop-blur-md">
                        <Users className="w-4 h-4" />
                        {'Təşkilatçı'} {organizationHandle ? (
                          <Link
                            href={localePath(`/o/${organizationHandle}`)}
                            className="text-white hover:text-yellow-300 transition-colors duration-200 hover:underline font-bold"
                          >
                            {organizationLabel}
                          </Link>
                        ) : (
                          <span className="font-bold">{organizationLabel}</span>
                        )}
                      </span>
                        )
                      })()}
                      <span className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-4 py-2 font-semibold backdrop-blur-md">
                        <TrendingUp className="w-4 h-4" />
                        {event.views || 0} {'baxış'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <SaveItemButtonContainer
                      itemId={event.id}
                      itemType="event"
                      itemTitle={event.title}
                      size="lg"
                      showText={false}
                      className="border-2 border-white/40 bg-white/20 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {!event.imageUrl && (
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge variant="primary" className="border border-blue-200 bg-blue-50 text-sm font-bold text-blue-700">
                      {getCategoryLabel(event.category)}
                    </Badge>
                    {(() => {
                      const organizationHandle = event.createdByOrganization?.urlHandle || event.createdByOrganization?.slug
                      const organizationLabel = event.organizationName || event.createdByOrganization?.organizationName || event.createdBy?.name || 'Naməlum'
                      return (
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <Users className="w-4 h-4 text-primary" />
                      {'Təşkilatçı'} {organizationHandle ? (
                        <Link
                          href={localePath(`/o/${organizationHandle}`)}
                          className="font-bold text-primary transition-colors duration-200 hover:text-blue-700 hover:underline"
                        >
                          {organizationLabel}
                        </Link>
                      ) : (
                        <span className="font-bold">{organizationLabel}</span>
                      )}
                    </span>
                      )
                    })()}
                  </div>
                  <h1 className="mb-4 text-3xl font-black text-gray-900 sm:text-4xl">{event.title}</h1>
                </div>
                  <div className="flex items-center gap-2">
                  <SaveItemButtonContainer
                    itemId={event.id}
                    itemType="event"
                    itemTitle={event.title}
                    size="lg"
                    showText={false}
                    className="border border-blue-200 bg-blue-50 text-primary hover:bg-blue-100"
                  />
                </div>
              </div>
            </CardContent>
          )}
            </Card>
            {/* About Section */}
            <Card id="event-content" className="border border-gray-200 shadow-sm">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Tag className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">{'Tədbir Təsviri'}</h2>
                </div>
                <div className="prose max-w-none text-gray-700 leading-relaxed">
                  {event.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-base">{paragraph}</p>
                  ))}
                </div>

                {event.tags && event.tags.length > 0 && (
                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                        <Tag className="h-4 w-4 text-accent" />
                      </div>
                      {'Teglər'}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {event.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
        </>
      }
      actionSection={
        <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <ExternalLink className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">Növbəti Addım</h3>
                </div>
                <div className="space-y-3">
                  {hasActiveApplicationLink ? (
                    <ButtonLink
                      href={event.applicationLink!}
                      variant="secondary"
                      size="lg"
                      icon={ExternalLink}
                      iconPosition="left"
                      hoverEffect="scale"
                      className="w-full"
                      external
                    >
                      Müraciət et
                    </ButtonLink>
                  ) : (
                    <p className="text-sm text-red-600">Müraciət linki tapılmadı.</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {`${event.views || 0} nəfər bu tədbirə baxıb.`}
                  </p>
                </div>
              </CardContent>
            </Card>
      }
      sidebar={
        <>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-black text-gray-900">{'Tədbir Məlumatları'}</h3>
              </div>
              <div className="space-y-5">
                <div className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                </div>
                <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base">{formatDate(event.eventDate)}</p>
                    <p className="text-sm text-gray-600 font-medium">{formatTime(event.eventDate)}</p>
                    {event.endDate && (
                      <p className="text-sm text-gray-600 mt-1">{'tarixinədək'}: {formatDate(event.endDate)} saat {formatTime(event.endDate)}</p>
                    )}
                    {Array.isArray(event.sessions) && event.sessions.length > 0 && (
                      <div className="mt-2 space-y-1 text-xs text-gray-600">
                        {event.sessions.map((session, index) => (
                          <p key={`${session.date}-${session.startTime}-${index}`}>
                            {session.date}: {session.startTime} - {session.endTime}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 capitalize text-base">{getLocationTypeLabel(event.location.type)}</p>
                    {(event.location.type === 'physical' || event.location.type === 'hybrid') && event.location.address && (
                      <p className="text-sm text-gray-600 font-medium">
                        {event.location.address}
                        {event.location.city && `, ${event.location.city}`}
                        {event.location.country && `, ${event.location.country}`}
                      </p>
                    )}
                    {(event.location.type === 'online' || event.location.type === 'hybrid') && event.location.onlineLink && (
                      <a href={event.location.onlineLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 underline font-semibold mt-1 inline-block">
                        {'Onlayn Qoşul'} →
                      </a>
                    )}
                  </div>
                </div>
                {event.applicationDeadline && (
                  <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-slate-50 p-4">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${isDeadlinePassed(event.applicationDeadline) ? 'bg-red-100' : 'bg-blue-100'}`}>
                      <Clock className={`h-5 w-5 ${isDeadlinePassed(event.applicationDeadline) ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base">{'Müraciət üçün son tarix'}</p>
                      <p className={`text-sm font-semibold ${isDeadlinePassed(event.applicationDeadline) ? 'text-red-600' : 'text-gray-600'}`}>
                        {formatDateTime(event.applicationDeadline)}
                        {isDeadlinePassed(event.applicationDeadline) && ` (${'Son tarix keçib'})`}
                      </p>
                    </div>
                  </div>
                )}
                {(event.audienceAgeMin !== undefined && event.audienceAgeMax !== undefined) && (
                  <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-slate-50 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100">
                      <Users className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base">İştirakçı profili</p>
                      <p className="text-sm text-gray-600 font-medium">Yaş aralığı: {event.audienceAgeMin} - {event.audienceAgeMax}</p>
                      {event.certification?.provided && (
                        <p className="text-sm text-gray-600 font-medium">Sertifikat təqdim olunur</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                    <Tag className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base">Növ</p>
                    <p className="text-sm text-gray-600 font-medium">{getEventTypeLabel(event.eventType)}</p>
                  </div>
                </div>
                {typeof event.maxParticipants === 'number' && event.maxParticipants > 0 && (
                  <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-slate-50 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                      <Users className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base">Maksimum iştirakçı sayı</p>
                      <p className="text-sm text-gray-600 font-medium">{event.maxParticipants} (məlumat xarakterlidir)</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {(Array.isArray(event.requirements) && event.requirements.length > 0) ||
          (Array.isArray(event.participantBenefits) && event.participantBenefits.length > 0) ? (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-black text-gray-900">Profil və faydalar</h3>
                {Array.isArray(event.requirements) && event.requirements.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-bold text-gray-800">Tələblər</p>
                    <ul className="mt-2 list-disc pl-5 text-sm text-gray-600 space-y-1">
                      {event.requirements.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(event.participantBenefits) && event.participantBenefits.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-bold text-gray-800">İştirakçı faydaları</p>
                    <ul className="mt-2 list-disc pl-5 text-sm text-gray-600 space-y-1">
                      {event.participantBenefits.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
          <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">Təşkilatçı</h3>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="font-bold text-gray-900 text-lg">
                      {event.organizationName || 'Naməlum təşkilat'}
                    </p>
                    <p className="text-sm text-gray-600 font-medium mt-1">Əlaqə: {event.createdBy?.name}</p>
                  </div>
                  {(event.createdByOrganization?.urlHandle || event.createdByOrganization?.slug) && (
                    <ButtonLink
                      href={localePath(`/o/${event.createdByOrganization?.urlHandle || event.createdByOrganization?.slug}`)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      hoverEffect="scale"
                    >
                      Təşkilat profilinə bax
                    </ButtonLink>
                  )}
                </div>
              </CardContent>
            </Card>
        </>
      }
    />
    </>
  )
}

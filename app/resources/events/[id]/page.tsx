'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, MapPin, Users, Clock, ExternalLink, Tag, Sparkles, TrendingUp } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumb } from '@/components/ui'
import SaveButton from '@/components/SaveButton'
import ViewTracker from '@/components/ViewTracker'
import { LoadingState, ErrorState } from '@/components/shared'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

interface Event { _id: string
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
  maxParticipants?: number
  currentParticipants: number
  tags: string[]
  imageUrl?: string
  createdBy: { _id: string
    name: string }
  organizationName?: string
  isApproved: boolean
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  views?: number }

export default function EventDetailPage() { const localePath = useLocalizedPath()

  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { if (params?.id) { fetchEvent(params.id as string) } }, [params?.id])

  const fetchEvent = async (id: string) => { try { const response = await fetch(`/api/events/${id}`)
      if (!response.ok) { throw new Error('Tədbir tapılmadı') }
      const data = await response.json()
      setEvent({ ...data.event,
        views: data.event.views || 0 }) } catch (error) { console.error('Tədbir yükləmə xətası:', error)
      setError('Tədbir detalları yüklənmədi') } finally { setLoading(false) } }

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

  if (loading) { return (
      <LoadingState
        text={'Tədbir təfərrüatları yüklənir...'}
      />
    ) }

  if (error || !event) { return (
      <ErrorState
        title={'Tədbir tapılmadı'}
        message={error || 'Axtardığın tədbir mövcud deyil.'}
        onRetry={() => router.back()}
        retryText={'Geri qayıt'}
        gradientFrom="from-red-50"
        gradientVia="via-orange-50"
        gradientTo="to-yellow-50"
      />
    ) }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <section className="relative overflow-hidden pt-28 pb-14 md:pt-36 md:pb-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-primary/10 blur-3xl" />

        <div className="section-padding relative z-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6">
              <Breadcrumb
                items={[
                  { label: 'Ana Səhifə', href: localePath('/') },
                  { label: 'Tədbirlər', href: localePath('/resources/events') },
                  { label: event.title, href: '#', current: true }
                ]}
              />
            </div>

            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-primary"
              >
                <ArrowLeft className="w-4 h-4" />
                {'Tədbirlərə qayıt'}
              </Button>
            </div>

            <Card className="mb-8 overflow-hidden border border-gray-200 bg-white shadow-sm">
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
                      <span className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-4 py-2 font-semibold backdrop-blur-md">
                        <Users className="w-4 h-4" />
                        {'Təşkilatçı'} {event.createdBy?._id ? (
                          <Link 
                            href={localePath(`/resources/organizations/${event.createdBy._id}`)}
                            className="text-white hover:text-yellow-300 transition-colors duration-200 hover:underline font-bold"
                          >
                            {event.organizationName || event.createdBy?.name || 'Naməlum'}
                          </Link>
                        ) : (
                          <span className="font-bold">{event.organizationName || event.createdBy?.name || 'Naməlum'}</span>
                        )}
                      </span>
                      <span className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-4 py-2 font-semibold backdrop-blur-md">
                        <TrendingUp className="w-4 h-4" />
                        {event.views || 0} {'baxış'}
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
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <Users className="w-4 h-4 text-primary" />
                      {'Təşkilatçı'} {event.createdBy?._id ? (
                        <Link 
                          href={localePath(`/resources/organizations/${event.createdBy._id}`)}
                          className="font-bold text-primary transition-colors duration-200 hover:text-blue-700 hover:underline"
                        >
                          {event.organizationName || event.createdBy?.name || 'Naməlum'}
                        </Link>
                      ) : (
                        <span className="font-bold">{event.organizationName || event.createdBy?.name || 'Naməlum'}</span>
                      )}
                    </span>
                  </div>
                  <h1 className="mb-4 text-3xl font-black text-gray-900 sm:text-4xl">{event.title}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <SaveButton
                    itemId={event._id}
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
          </div>
        </div>
      </section>

      <section className="section-padding pb-16 md:pb-20">
        <div className="mx-auto max-w-6xl grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card className="border border-gray-200 shadow-sm">
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
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* {'Tədbir Məlumatları'} */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">{'Tədbir Məlumatları'}</h3>
                </div>
                <div className="space-y-5">
                  {/* View Count */}
                  <div className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <ViewTracker
                      itemId={event._id}
                      itemType="event"
                      initialViews={event.views || 0}
                      showCount={true}
                      className="w-full"
                    />
                  </div>

                  {/* {'Tarix və Saat'} */}
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
                    </div>
                  </div>

                  {/* {'Yer'} */}
                  <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-slate-50 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 capitalize text-base">{getLocationTypeLabel(event.location.type)}</p>
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
                          {'Onlayn Qoşul'} →
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Participants */}
                  {event.maxParticipants && (
                    <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-slate-50 p-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-base">{'İştirakçılar'}</p>
                        <p className="text-sm text-gray-600 font-medium">
                          {event.currentParticipants} / {event.maxParticipants} {'qeydiyyatdan keçib'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* {'Müraciət üçün son tarix'} */}
                  {event.applicationDeadline && (
                    <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-slate-50 p-4">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${ isDeadlinePassed(event.applicationDeadline)
                          ? 'bg-red-100'
                          : 'bg-blue-100' }`}>
                        <Clock className={`h-5 w-5 ${ isDeadlinePassed(event.applicationDeadline)
                            ? 'text-red-600'
                            : 'text-blue-600' }`} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-base">{'Müraciət üçün son tarix'}</p>
                        <p className={`text-sm font-semibold ${ isDeadlinePassed(event.applicationDeadline) 
                            ? 'text-red-600' 
                            : 'text-gray-600' }`}>
                          {formatDateTime(event.applicationDeadline)}
                          {isDeadlinePassed(event.applicationDeadline) && ` (${'Son tarix keçib'})`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Application Link */}
            {event.applicationLink && !isDeadlinePassed(event.applicationDeadline || '') && (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <ExternalLink className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">{'Müraciət Et'}</h3>
                  </div>
                  <ButtonLink
                    href={event.applicationLink}
                    variant="secondary"
                    size="lg"
                    icon={ExternalLink}
                    iconPosition="left"
                    hoverEffect="scale"
                    className="w-full"
                    external
                  >
                    {'Müraciət Et'}
                  </ButtonLink>
                </CardContent>
              </Card>
            )}

            {/* {'Təşkilatçı'} Info */}
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
                  {event.createdBy?._id && (
                    <ButtonLink 
                      href={`/resources/organizations/${event.createdBy._id}`}
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
          </div>
        </div>
      </section>
    </div>
  ) }

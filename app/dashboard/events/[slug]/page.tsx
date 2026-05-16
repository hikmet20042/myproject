'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { Modal } from '@/components/ui/Modal'
import { Calendar, Clock, MapPin, Link as LinkIcon, Tag, Edit, Trash2, CheckCircle, XCircle, AlertCircle, ExternalLink, Eye, TrendingUp, Bookmark, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { PageStateGuard } from '@/components/shared'
import { useDeleteEvent, useEvent } from '@/lib/eventQueries'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { Card } from '@/components/ui/Card'
import { AppContainer } from '@/components/layout'
import { Badge } from '@/components/ui/Badge'

interface Event { _id: string
  slug: string
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
  status: 'pending' | 'approved' | 'rejected'
  approvedAt?: string
  approvedBy?: { name: string }
  rejectedAt?: string
  rejectionReason?: string
  adminComment?: string
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  views?: number
  uniqueViews?: number
  saves?: number
  createdBy: { name: string
    organizationName?: string } }

export default function EventDetail() {
  const localePath = useLocalizedPath()
  const router = useRouter()
  const params = useParams()
  const { showSuccess, showError } = useGlobalFeedback()
  const eventId = String(params?.slug || '')
  const eventQuery = useEvent(eventId)
  const event = (eventQuery.data || {}) as Event
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const deleteEventMutation = useDeleteEvent()

  const handleDelete = async () => { try { setDeleting(true)
      await deleteEventMutation.mutateAsync(eventId)
      showSuccess('Tədbir uğurla silindi.')
      router.push(localePath("/dashboard/events"))
    } catch (error: any) { console.error('Error deleting event:', error)
      showError(error?.message || 'Tədbiri silmək mümkün olmadı') } finally { setDeleting(false) } }

  const getStatusBadge = () => { if (!event) return null
    
    if (event.status === 'rejected') { return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="w-4 h-4 mr-2" />
          {'Rədd Edilib'}
        </span>
      ) }
    if (event.status === 'approved') { return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4 mr-2" />
          {'Təsdiqlənib və Yayımlanıb'}
        </span>
      ) }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
        <AlertCircle className="w-4 h-4 mr-2" />
        {'Yoxlanış Gözlənilir'}
      </span>
    ) }

  const formatDate = (dateString: string) => { const opts: Intl.DateTimeFormatOptions = { weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit' }
    try { return new Date(dateString).toLocaleDateString('az-AZ', opts) } catch (e) { return new Date(dateString).toLocaleString('az-AZ') } }

  const moderationReason = event.rejectionReason || event.adminComment || null
  return (
    <PageStateGuard
      isLoading={eventQuery.isLoading}
      isError={eventQuery.isError}
      isEmpty={!eventQuery.isLoading && !eventQuery.isError && !eventQuery.data}
      loadingText="Tədbir yüklənir..."
      errorTitle="Tədbir tapılmadı"
      errorMessage={eventQuery.error instanceof Error ? eventQuery.error.message : 'Axtardığınız tədbiri tapmaq mümkün olmadı.'}
      retryText="Yenidən yoxla"
      onRetry={() => { void eventQuery.refetch() }}
      emptyTitle="Tədbir tapılmadı"
      emptyMessage="Axtardığınız tədbiri tapmaq mümkün olmadı."
    >
    <div className="relative min-h-screen overflow-hidden bg-background py-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

      <AppContainer className="relative z-10 max-w-4xl py-0">
        {/* Header */}
        <Card className="mb-8 bg-white/90 backdrop-blur-sm p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Button
                onClick={() => router.push(localePath("/dashboard/events"))}
                variant="ghost"
                className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                ← {'Tədbirlərə qayıt'}
              </Button>
              <div className="mb-4 flex items-center gap-4">
                <h1 className="text-3xl font-black text-slate-900">{event.title}</h1>
                {getStatusBadge()}
              </div>
              {/* View Stats */}
              {((event.views ?? 0) > 0 || (event.uniqueViews ?? 0) > 0 || (event.saves ?? 0) > 0) && (
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-50 border border-blue-100">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      {event.views?.toLocaleString() || 0} baxış
                    </span>
                    <span className="text-xs text-blue-500">
                      ({event.uniqueViews?.toLocaleString() || 0} unikal)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-100">
                    <Bookmark className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">
                      {(event.saves || 0).toLocaleString()} saxlama
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Location Details */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {'Yer'}
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-slate-700">{'Növ'}:</span>
                  <span className="ml-2 capitalize">{event.location.type}</span>
                </div>
                
                {(event.location.type === 'physical' || event.location.type === 'hybrid') && (
                  <>
                    {event.location.address && (
                      <div>
                        <span className="font-medium text-slate-700">{'Ünvan'}:</span>
                        <span className="ml-2">{event.location.address}</span>
                      </div>
                    )}
                    {event.location.city && (
                      <div>
                        <span className="font-medium text-slate-700">{'Şəhər:'}</span>
                        <span className="ml-2">{event.location.city}</span>
                      </div>
                    )}
                    {event.location.country && (
                      <div>
                        <span className="font-medium text-slate-700">{'Ölkə:'}</span>
                        <span className="ml-2">{event.location.country}</span>
                      </div>
                    )}
                  </>
                )}
                
                {(event.location.type === 'online' || event.location.type === 'hybrid') && event.location.onlineLink && (
                  <div>
                    <span className="font-medium text-slate-700">{'Onlayn görüş linki'}:</span>
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
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">{'Tədbir Məlumatları'}</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">{'Başlanğıc Tarixi'}</p>
                    <p className="text-slate-600 text-sm">{formatDate(event.eventDate)}</p>
                  </div>
                </div>

                {Array.isArray(event.sessions) && event.sessions.length > 0 && (
                  <div className="pl-8 text-sm text-slate-600 space-y-1">
                    {event.sessions.map((session, index) => (
                      <p key={`${session.date}-${session.startTime}-${index}`}>
                        {session.date}: {session.startTime} - {session.endTime}
                      </p>
                    ))}
                  </div>
                )}
                
                {event.endDate && (
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">{'Bitmə Tarixi'}</p>
                      <p className="text-slate-600 text-sm">{formatDate(event.endDate)}</p>
                    </div>
                  </div>
                )}
                
                {event.applicationDeadline && (
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">{'Müraciət üçün son tarix'}</p>
                      <p className="text-slate-600 text-sm">{formatDate(event.applicationDeadline)}</p>
                    </div>
                  </div>
                )}
                
                {event.applicationLink && (
                  <div className="flex items-start">
                    <LinkIcon className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">{'Xarici müraciət'}</p>
                      <a
                        href={event.applicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
                      >
                        Müraciət linki
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                )}

                {(event.audienceAgeMin !== undefined && event.audienceAgeMax !== undefined) && (
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">İştirakçı profili</p>
                      <p className="text-slate-600 text-sm">Yaş aralığı: {event.audienceAgeMin} - {event.audienceAgeMax}</p>
                      {event.certification?.provided && <p className="text-slate-600 text-sm">Sertifikat təqdim olunur</p>}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Status Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Status məlumatı</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-slate-700">{'Moderasiya statusu:'}</span>
                  <span className="ml-2 capitalize">{event.status}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">{'Yaradılıb:'}</span>
                  <span className="ml-2">{new Date(event.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Son yenilənmə:</span>
                  <span className="ml-2">{new Date(event.updatedAt).toLocaleDateString()}</span>
                </div>
                {event.approvedAt && (
                  <div>
                    <span className="font-medium text-slate-700">{'Təsdiqləndi:'}</span>
                    <span className="ml-2">{new Date(event.approvedAt).toLocaleDateString()}</span>
                    {event.approvedBy && (
                      <p className="text-slate-600 text-xs mt-1">təsdiqləyən: {event.approvedBy.name}</p>
                    )}
                  </div>
                )}
                {event.rejectedAt && (
                  <div>
                    <span className="font-medium text-slate-700">{'Rədd Edildi:'}</span>
                    <span className="ml-2">{new Date(event.rejectedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {moderationReason && (
                  <div>
                    <span className="font-medium text-slate-700">{'Rədd səbəbi:'}</span>
                    <p className="mt-1 text-slate-600">{moderationReason}</p>
                  </div>
                )}
                {event.adminComment && (
                  <div>
                    <span className="font-medium text-slate-700">{'Admin şərhi:'}</span>
                    <p className="mt-1 text-slate-600">{event.adminComment}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </Card>
      </AppContainer>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Tədbiri sil"
        size="sm"
        className="rounded-xl"
      >
            <p className="text-slate-600 mb-6">
              "{event.title}" adlı tədbiri silmək istədiyinizə əminsiniz? Bu əməliyyatı geri qaytarmaq mümkün deyil.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
              >
                Ləğv et
              </Button>
              <Button
                onClick={handleDelete}
                variant="danger"
                disabled={deleting}
              >
                {deleting ? 'Silinir...' : 'Tədbiri sil'}
              </Button>
            </div>
      </Modal>
    </div>
    </PageStateGuard>
  ) }

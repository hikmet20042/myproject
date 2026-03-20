'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import * as Dialog from '@radix-ui/react-dialog'
import { Calendar, Clock, MapPin, Users, Link as LinkIcon, Tag, Edit, Trash2, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { LoadingState, ErrorState } from '@/components/shared'

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
  isApproved: boolean
  approvedAt?: string
  approvedBy?: { name: string }
  rejectedAt?: string
  rejectionReason?: string
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  createdBy: { name: string
    organizationName?: string } }

export default function EventDetail() {
  const localePath = useLocalizedPath()
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadEvent = useCallback(async () => { try { setLoading(true)
      
  const response = await fetch(`/api/events/${params?.id}`)
      const data = await response.json()
      
      if (response.ok) { setEvent(data.event) } else { setError(data.error || 'Tədbiri yükləmək mümkün olmadı') } } catch (error) { console.error('Error loading event:', error)
      setError('Tədbiri yükləmək mümkün olmadı') } finally { setLoading(false) } }, [params?.id])

  useEffect(() => { if (params?.id) { loadEvent() } }, [loadEvent, params?.id])

  const handleDelete = async () => { try { setDeleting(true)
      const response = await fetch(`/api/events/${params?.id}`, { method: 'DELETE' })
      
      if (response.ok) { router.push(localePath("/dashboard/events")) } else { const data = await response.json()
        alert('Tədbiri silmək mümkün olmadı: ' + data.error) } } catch (error) { console.error('Error deleting event:', error)
      alert('Tədbiri silmək mümkün olmadı') } finally { setDeleting(false) } }

  const getStatusBadge = () => { if (!event) return null
    
    if (event.rejectedAt) { return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="w-4 h-4 mr-2" />
          {'Rədd Edilib'}
        </span>
      ) }
    if (event.isApproved) { return (
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

  if (loading) { return <LoadingState text={'Tədbir yüklənir...'} /> }

  if (error || !event) { return (
      <ErrorState 
        title={'Tədbir tapılmadı'}
        message={error || 'Axtardığınız tədbiri tapmaq mümkün olmadı.'}
        retryText={'Tədbirlərə qayıt'}
        onRetry={() => router.push(localePath("/dashboard/events"))}
      />
    ) }
  return (
    <div className="relative min-h-screen overflow-hidden bg-background py-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
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
                <h1 className="text-3xl font-black text-gray-900">{event.title}</h1>
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
                {'Tədbiri redaktə et'}
              </Button>
              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="danger"
                icon={Trash2}
                iconPosition="left"
                size="sm"
              >
                {'Tədbiri sil'}
              </Button>
            </div>
          </div>
        </div>

        {/* Rejection Notice */}
        {event.rejectionReason && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-6">
            <h3 className="text-lg font-medium text-red-900 mb-2">{'Rədd edilmə səbəbi'}</h3>
            <p className="text-red-800">
              <strong>{'Əvvəlki rədd səbəbi'}:</strong> {event.rejectionReason}
            </p>
            <p className="text-red-700 mt-2 text-sm">
              {'Yuxarıdakı səbəbi yoxla və yenidən göndərməzdən əvvəl dəyişiklik et.'}
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
              className="rounded-xl border border-gray-200 object-cover shadow-sm"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{'Təsvir'}</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* Tags */}
            {event.tags.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  Teqlər
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
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {'Yer'}
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">{'Növ'}:</span>
                  <span className="ml-2 capitalize">{event.location.type}</span>
                </div>
                
                {(event.location.type === 'physical' || event.location.type === 'hybrid') && (
                  <>
                    {event.location.address && (
                      <div>
                        <span className="font-medium text-gray-700">{'Ünvan'}:</span>
                        <span className="ml-2">{event.location.address}</span>
                      </div>
                    )}
                    {event.location.city && (
                      <div>
                        <span className="font-medium text-gray-700">{'Şəhər:'}</span>
                        <span className="ml-2">{event.location.city}</span>
                      </div>
                    )}
                    {event.location.country && (
                      <div>
                        <span className="font-medium text-gray-700">{'Ölkə:'}</span>
                        <span className="ml-2">{event.location.country}</span>
                      </div>
                    )}
                  </>
                )}
                
                {(event.location.type === 'online' || event.location.type === 'hybrid') && event.location.onlineLink && (
                  <div>
                    <span className="font-medium text-gray-700">{'Onlayn görüş linki'}:</span>
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
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{'Tədbir Məlumatları'}</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{'Başlanğıc Tarixi'}</p>
                    <p className="text-gray-600 text-sm">{formatDate(event.eventDate)}</p>
                  </div>
                </div>
                
                {event.endDate && (
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{'Bitmə Tarixi'}</p>
                      <p className="text-gray-600 text-sm">{formatDate(event.endDate)}</p>
                    </div>
                  </div>
                )}
                
                {event.applicationDeadline && (
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{'Müraciət üçün son tarix'}</p>
                      <p className="text-gray-600 text-sm">{formatDate(event.applicationDeadline)}</p>
                    </div>
                  </div>
                )}
                
                {event.maxParticipants && (
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{'Tutum'}</p>
                      <p className="text-gray-600 text-sm">
                        {event.currentParticipants} / {event.maxParticipants} {'iştirakçı'}
                      </p>
                    </div>
                  </div>
                )}
                
                {event.applicationLink && (
                  <div className="flex items-start">
                    <LinkIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{'Qeydiyyat'}</p>
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
              </div>
            </div>

            {/* Status Information */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status məlumatı</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">{'Yaradılıb:'}</span>
                  <span className="ml-2">{new Date(event.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Son yenilənmə:</span>
                  <span className="ml-2">{new Date(event.updatedAt).toLocaleDateString()}</span>
                </div>
                {event.approvedAt && (
                  <div>
                    <span className="font-medium text-gray-700">{'Təsdiqləndi:'}</span>
                    <span className="ml-2">{new Date(event.approvedAt).toLocaleDateString()}</span>
                    {event.approvedBy && (
                      <p className="text-gray-600 text-xs mt-1">təsdiqləyən: {event.approvedBy.name}</p>
                    )}
                  </div>
                )}
                {event.rejectedAt && (
                  <div>
                    <span className="font-medium text-gray-700">{'Rədd Edildi:'}</span>
                    <span className="ml-2">{new Date(event.rejectedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog.Root
        open={showDeleteModal}
        onOpenChange={(open) => { if (!open) setShowDeleteModal(false) }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">Tədbiri sil</Dialog.Title>
            <Dialog.Description className="text-gray-600 mb-6">
              "{event.title}" adlı tədbiri silmək istədiyinizə əminsiniz? Bu əməliyyatı geri qaytarmaq mümkün deyil.
            </Dialog.Description>
            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <Button
                  variant="outline"
                  disabled={deleting}
                >
                  Ləğv et
                </Button>
              </Dialog.Close>
              <Button
                onClick={handleDelete}
                variant="danger"
                disabled={deleting}
              >
                {deleting ? 'Silinir...' : 'Tədbiri sil'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  ) }
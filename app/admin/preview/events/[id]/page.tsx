'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/lib/auth/client'
import { useRouter, useParams } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { Calendar, MapPin, Users, Link as LinkIcon, Clock, Tag, ArrowLeft, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { LoadingState, ErrorState } from '@/components/shared'

interface Event { _id: string
  title: string
  description: string
  category: string
  eventType: 'event' | 'training' | 'workshop' | 'conference' | 'seminar'
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
  status: 'pending' | 'approved' | 'rejected'
  adminComment?: string
  approvedAt?: string
  approvedBy?: { _id: string
    name: string }
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  // Training-specific fields
  duration?: { value: number
    unit: 'hours' | 'days' | 'weeks' }
  schedule?: string
  prerequisites?: string[]
  learningOutcomes?: string[]
  certification?: { provided: boolean
    type?: string
    accreditedBy?: string }
  cost?: { amount: number
    currency: string
    scholarshipAvailable: boolean }
  targetAudience?: string[]
  syllabus?: { modules: Array<{ title: string
      description: string
      duration: string }> } }

export default function AdminEventPreview() { const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [adminComment, setAdminComment] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const localePath = useLocalizedPath()
  const fetchEvent = useCallback(async () => { if (!params?.id) { setError('Tapılmadı')
      setLoading(false)
      return }

    try { const response = await fetch(`/api/events/${params.id}`)
      if (response.ok) { const data = await response.json()
        setEvent(data.event) } else { setError('Yükləmək alınmadı') } } catch (error) { setError('Yükləmə xətası') } finally { setLoading(false) } }, [params?.id])

  useEffect(() => { if (status === 'loading') return
    if (session?.user?.role !== 'admin') { router.push(localePath("/"))
      return }
    fetchEvent() }, [fetchEvent, router, session, status, params?.id, localePath])

  const handleApprove = async () => { if (!params?.id) return
    
    setActionLoading(true)
    try { const response = await fetch(`/api/admin/events/${params.id}`, { method: 'PATCH',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ action: 'approve' }) })

      if (response.ok) { router.push(localePath("/admin?tab=events")) } else { setError('Təsdiqləmə alınmadı') } } catch (error) { setError('Təsdiqləmə xətası') } finally { setActionLoading(false) } }

  const handleReject = async () => { if (!params?.id) return
    
    if (!adminComment.trim()) { setError('Rədd səbəbi tələb olunur')
      return }

    setActionLoading(true)
    try { const response = await fetch(`/api/admin/events/${params.id}`, { method: 'PATCH',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ action: 'reject',
          adminComment }) })

      if (response.ok) { router.push(localePath("/admin?tab=events")) } else { setError('Rədd etmək alınmadı') } } catch (error) { setError('Rədd xətası') } finally { setActionLoading(false)
      setShowRejectModal(false) } }

  const formatEventType = (type: string) => {
    const eventTypeMap: Record<string, string> = {
      event: 'Tədbir',
      training: 'Təlim',
      workshop: 'Seminar',
      conference: 'Konfrans',
      seminar: 'Seminar'
    }
    return eventTypeMap[type] || 'Tədbir'
  }

  const formatDate = (dateString: string) => { if (!dateString) return 'Göstərilməyib'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Etibarsız tarix'
    return date.toLocaleDateString('en-US', { year: 'numeric',
      month: 'long',
      day: 'numeric' }) }

  const formatDateTime = (dateString: string) => { if (!dateString) return 'Göstərilməyib'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Etibarsız tarix'
    return date.toLocaleString('en-US', { year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit' }) }

  const getStatusBadge = () => { if (event?.status === 'rejected') { return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          {'Rədd edilib'}
        </span>
      ) }
    if (event?.status === 'approved') { return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          {'Təsdiqlənib'}
        </span>
      ) }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        {'Baxışda'}
      </span>
    ) }

  if (loading) { return <LoadingState text={'Yüklənir'} /> }

  if (error || !event) { return (
      <ErrorState 
        title={'Tapılmadı'}
        message={error || 'Axtardığınız tədbir mövcud deyil.'}
        retryText={'Adminə Qayıt'}
        onRetry={() => router.push(localePath("/admin"))}
      />
    ) }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background py-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push(localePath("/admin?tab=events"))}
            variant="ghost"
            size="sm"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {'Adminə Qayıt'}
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                {getStatusBadge()}
                <span className="text-gray-500">{'Təşkilatçı'} {event.organizationName || event.createdBy?.name || 'Naməlum'}</span>
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
                  Rədd et
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  variant="primary"
                  size="md"
                >
                  {actionLoading ? 'Emal olunur...' : 'Təsdiq et'}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{'Təsvir'}</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* Tags */}
            {event.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{'Teqlər'}</h3>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{'Məkan təfərrüatları'}</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">{'Növ'}:</span>
                  <span className="ml-2 capitalize">{event.location.type}</span>
                </div>
                
                {event.location.type !== 'online' && (
                  <>
                    {event.location.address && (
                      <div>
                        <span className="font-medium text-gray-700">{'Ünvan'}:</span>
                        <span className="ml-2">{event.location.address}</span>
                      </div>
                    )}
                    {event.location.city && (
                      <div>
                        <span className="font-medium text-gray-700">{'Şəhər'}:</span>
                        <span className="ml-2">{event.location.city}</span>
                      </div>
                    )}
                    {event.location.country && (
                      <div>
                        <span className="font-medium text-gray-700">{'Ölkə'}:</span>
                        <span className="ml-2">{event.location.country}</span>
                      </div>
                    )}
                  </>
                )}
                
                {(event.location.type === 'online' || event.location.type === 'hybrid') && event.location.onlineLink && (
                  <div>
                    <span className="font-medium text-gray-700">{'Onlayn keçid'}:</span>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{'Tədbir təfərrüatları'}</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Tag className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{'Tədbir növü'}</p>
                    <p className="text-gray-600 text-sm">
                      {formatEventType(event.eventType)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Tag className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{'Kateqoriya'}</p>
                    <p className="text-gray-600 text-sm">{event.category}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{'Tədbir tarixi'}</p>
                    <p className="text-gray-600 text-sm">{formatDate(event.eventDate)}</p>
                  </div>
                </div>
                
                {event.endDate && (
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{'Bitmə tarixi'}</p>
                      <p className="text-gray-600 text-sm">{formatDate(event.endDate)}</p>
                    </div>
                  </div>
                )}
                
                {event.applicationDeadline && (
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{'Müraciət son tarixi'}</p>
                      <p className="text-gray-600 text-sm">{formatDateTime(event.applicationDeadline)}</p>
                    </div>
                  </div>
                )}
                
                {event.maxParticipants && (
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{'Tutum'}</p>
                      <p className="text-gray-600 text-sm">
                        {event.currentParticipants} / {event.maxParticipants} iştirakçı
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
                        Qeydiyyat linki
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Təlim təfərrüatları</h3>
                <div className="space-y-4">
                  {event.duration && (
                    <div className="flex items-start">
                      <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{'Müddət'}</p>
                        <p className="text-gray-600 text-sm">{event.duration.value} {event.duration.unit}</p>
                      </div>
                    </div>
                  )}
                  
                  {event.cost && (
                    <div className="flex items-start">
                      <Tag className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{'Qiymət'}</p>
                        <p className="text-gray-600 text-sm">
                          {event.cost.amount > 0 ? `${event.cost.amount} ${event.cost.currency}` : 'Pulsuz'}
                          {event.cost.scholarshipAvailable && ' (Təqaüd imkanı var)'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {event.certification?.provided && (
                    <div className="flex items-start">
                      <Tag className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{'Sertifikatlaşdırma'}</p>
                        <p className="text-gray-600 text-sm">
                          {event.certification.type}
                          {event.certification.accreditedBy && ` (${event.certification.accreditedBy} tərəfindən)`}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {event.prerequisites && event.prerequisites.length > 0 && (
                    <div className="flex items-start">
                      <Tag className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{'İlkin Şərtlər'}</p>
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
                        <p className="font-medium text-gray-900">Öyrənmə nəticələri</p>
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
                        <p className="font-medium text-gray-900">Hədəf auditoriya</p>
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
                        <p className="font-medium text-gray-900">{'Cədvəl'}</p>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{event.schedule}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{'Vəziyyət məlumatı'}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">{'Yaradılıb:'}</span>
                  <span className="ml-2">{formatDateTime(event.createdAt)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Son yenilənmə:</span>
                  <span className="ml-2">{formatDateTime(event.updatedAt)}</span>
                </div>
                {event.approvedAt && (
                  <div>
                    <span className="font-medium text-gray-700">{'Təsdiqləndi:'}</span>
                    <span className="ml-2">{formatDateTime(event.approvedAt)}</span>
                  </div>
                )}
                {event.adminComment && (
                  <div>
                    <span className="font-medium text-gray-700">{'İdarəçi şərhi'}:</span>
                    <p className="mt-1 text-gray-600">{event.adminComment}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Dialog.Root
        open={showRejectModal}
        onOpenChange={(open) => { if (!open) { setShowRejectModal(false)
            setAdminComment('')
            setError('') } }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">Tədbiri rədd et</Dialog.Title>
            <Dialog.Description className="text-gray-600 mb-4">
              Bu tədbiri rədd etmə səbəbini daxil edin:
            </Dialog.Description>
            <textarea
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
              placeholder={'İdarəçi şərhini daxil edin...'}
            />
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <Button variant="outline" size="sm">
                  Ləğv et
                </Button>
              </Dialog.Close>
              <Button
                onClick={handleReject}
                disabled={actionLoading || !adminComment.trim()}
                variant="danger"
                size="sm"
              >
                {actionLoading ? 'Rədd edilir...' : 'Tədbiri rədd et'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  ) }
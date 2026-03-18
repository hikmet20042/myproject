'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/lib/auth/client'
import { useRouter, useParams } from 'next/navigation'
import { Calendar, MapPin, Users, Link as LinkIcon, Clock, Tag, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { LoadingState, ErrorState } from '@/components/shared'
import { useDashboardData } from '@/features/dashboard/context/DashboardDataProvider'

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
  rejectedAt?: string
  rejectionReason?: string
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string }

export default function EditEvent() { const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { markEventsDirty } = useDashboardData()
  const [loading, setLoading] = useState(false)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [event, setEvent] = useState<Event | null>(null)
  const [error, setError] = useState('')
  const localePath = useLocalizedPath()
  const [formData, setFormData] = useState({ title: '',
    description: '',
    category: '',
    eventDate: '',
    endDate: '',
    location: { type: 'physical' as 'online' | 'physical' | 'hybrid',
      address: '',
      city: '',
      country: '',
      onlineLink: '' },
    applicationLink: '',
    applicationDeadline: '',
    maxParticipants: '',
    tags: '',
    imageUrl: '' })
  const loadEvent = useCallback(async () => { try { setLoadingEvent(true)
      const response = await fetch(`/api/events/${params?.id}`)
      const data = await response.json()
      
      if (response.ok) { const eventData = data.event
        setEvent(eventData)
        setFormData({ title: eventData.title || '',
          description: eventData.description || '',
          category: eventData.category || '',
          eventDate: eventData.eventDate ? new Date(eventData.eventDate).toISOString().slice(0, 16) : '',
          endDate: eventData.endDate ? new Date(eventData.endDate).toISOString().slice(0, 16) : '',
          location: { type: eventData.location?.type || 'physical',
            address: eventData.location?.address || '',
            city: eventData.location?.city || '',
            country: eventData.location?.country || '',
            onlineLink: eventData.location?.onlineLink || '' },
          applicationLink: eventData.applicationLink || '',
          applicationDeadline: eventData.applicationDeadline ? new Date(eventData.applicationDeadline).toISOString().slice(0, 16) : '',
            maxParticipants: eventData.maxParticipants?.toString() || '',
            tags: Array.isArray(eventData.tags) ? eventData.tags.join(', ') : '',
            imageUrl: eventData.imageUrl || '' }) } else { setError(data.error || 'Tədbiri yükləmək alınmadı') } } catch (error) { console.error('Error loading event:', error)
          setError('Tədbiri yükləmək alınmadı') } finally { setLoadingEvent(false) } }, [params?.id])

  useEffect(() => { if (status === 'loading') return
    if (!session) { router.push(localePath('/auth/signin'))
      return }
    if (params?.id) { loadEvent() } }, [loadEvent, params?.id, status, session, router, localePath])

  if (status === 'loading') { return <LoadingState text={'Yüklənir'} /> }

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault()
    setLoading(true)

    try { // Prepare data
      const eventData = { ...formData,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        eventDate: new Date(formData.eventDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        applicationDeadline: formData.applicationDeadline ? new Date(formData.applicationDeadline).toISOString() : undefined }

      const response = await fetch(`/api/events/${params?.id}`, { method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData) })

      const data = await response.json()

      if (response.ok) {
        markEventsDirty()
        router.push(localePath("/dashboard/events"))
      } else { alert('Tədbir yenilənərkən xəta baş verdi: ' + data.error) } } catch (error) { console.error('Error updating event:', error)
      alert('Tədbiri yeniləmək alınmadı') } finally { setLoading(false) } }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { const { name, value } = e.target
    
    if (name.startsWith('location.')) { const locationField = name.split('.')[1]
      setFormData(prev => ({ ...prev,
        location: { ...prev.location,
          [locationField]: value } })) } else { setFormData(prev => ({ ...prev,
        [name]: value })) } }

  if (loadingEvent) { return <LoadingState text={'Tədbir yüklənir...'} /> }

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
          <h1 className="text-3xl font-black text-gray-900">{'Tədbiri redaktə et'}</h1>
          <p className="mt-2 text-gray-600">
            {event.isApproved 
              ? 'Bu tədbirdə dəyişiklik etdikdə yenidən təsdiq tələb olunur'
              : 'Tədbir məlumatlarını lazım olduqda yenilə' }
          </p>
          
          {event.rejectionReason && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">
                <strong>{'Əvvəlki rədd səbəbi'}</strong> {event.rejectionReason}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{'Əsas Məlumatlar'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Tədbir adı'} *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={'Tədbirin adını yaz'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Kateqoriya'} *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{'Kateqoriyanı seç'}</option>
                  {eventCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Maks. iştirakçı sayı'}
                </label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={'məs., 30'}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Təsvir'} *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  maxLength={2000}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={'Tədbirin qısa təsvirini yaz'}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Teglər'}
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={'Tegləri vergüllə ayır'}
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {'Tarix və Saat'}
              </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Başlanğıc Tarixi'} *
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
                  {'Bitmə Tarixi'}
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
                  {'Müraciət üçün son tarix'}
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
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              {'Yer'}
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Yer növü'} *
                </label>
                <select
                  name="location.type"
                  value={formData.location.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="physical">{'Fiziki'}</option>
                  <option value="online">{'Onlayn'}</option>
                  <option value="hybrid">{'Hibrid'}</option>
                </select>
              </div>
              
              {(formData.location.type === 'physical' || formData.location.type === 'hybrid') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {'Ünvan'}
                    </label>
                    <input
                      type="text"
                      name="location.address"
                      value={formData.location.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={'Küçə ünvanı'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {'Şəhər'}
                    </label>
                    <input
                      type="text"
                      name="location.city"
                      value={formData.location.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={'Şəhər'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {'Ölkə'}
                    </label>
                    <input
                      type="text"
                      name="location.country"
                      value={formData.location.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={'Ölkə'}
                    />
                  </div>
                </div>
              )}
              
              {(formData.location.type === 'online' || formData.location.type === 'hybrid') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {'Onlayn görüş linki'}
                  </label>
                  <input
                    type="url"
                    name="location.onlineLink"
                    value={formData.location.onlineLink}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={'https://...'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{'Əlavə Məlumat'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Müraciət / Qeydiyyat linki'}
                </label>
                <input
                  type="url"
                  name="applicationLink"
                  value={formData.applicationLink}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={'https://...'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Tədbir şəkil linki'}
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={'https://...'}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
            >
              {'Ləğv et'}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
            >
              {loading ? 'Yenilənir...' : 'Tədbiri yenilə'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  ) }
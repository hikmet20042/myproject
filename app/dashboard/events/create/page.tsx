'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from '@/lib/auth/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, MapPin, Users, Link as LinkIcon, Clock, Tag, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Input, Select, Button, TextArea } from '@/components/ui'
import { FormSection } from '@/components/forms'
import { LoadingState } from '@/components/shared'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
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

function CreateEventContent() { const { data: session, status } = useSession()
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { markEventsDirty } = useDashboardData()
  const searchParams = useSearchParams()
  // Normalize field sizes for visual consistency
  const commonInputProps = { inputSize: 'md' as const }
  const commonSelectProps = { selectSize: 'md' as const }
  const commonTextAreaProps = { textAreaSize: 'md' as const }
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ title: '',
    description: '',
    category: '',
    eventType: 'event' as 'event' | 'training' | 'workshop' | 'seminar',
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
    imageUrl: '',
    // Training-specific fields
    duration: { value: '',
      unit: 'hours' as 'hours' | 'days' | 'weeks' },
    schedule: '',
    prerequisites: [] as string[],
    learningOutcomes: [] as string[],
    targetAudience: '',
    syllabus: '',
    certification: { provided: false,
      type: '',
      accreditedBy: '' },
    cost: { isFree: false,
      amount: '',
      currency: 'USD',
      scholarshipAvailable: false } })

  useEffect(() => { if (status === 'loading') return
    if (!session) { router.push(localePath('/auth/signin')) } }, [status, session, router, localePath])

  // Handle URL parameters for event type
  useEffect(() => { const typeParam = searchParams?.get('type')
    if (typeParam && ['training', 'workshop', 'seminar'].includes(typeParam)) { setFormData(prev => ({ ...prev,
        eventType: typeParam as 'training' | 'workshop' | 'seminar' })) } }, [searchParams])

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

      const response = await fetch('/api/events', { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData) })

      const data = await response.json()

      if (response.ok) {
        markEventsDirty()
        router.push(localePath('/dashboard/events'))
      } else { alert('Tədbir yaradılarkən xəta baş verdi: ' + data.error) } } catch (error) { console.error('Error creating event:', error)
      alert('Tədbir yaratmaq alınmadı') } finally { setLoading(false) } }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    if (name.startsWith('location.')) { const locationField = name.split('.')[1]
      setFormData(prev => ({ ...prev,
        location: { ...prev.location,
          [locationField]: value } })) } else if (name.startsWith('duration.')) { const durationField = name.split('.')[1]
      setFormData(prev => ({ ...prev,
        duration: { ...prev.duration,
          [durationField]: value } })) } else if (name.startsWith('certification.')) { const certField = name.split('.')[1]
      setFormData(prev => ({ ...prev,
        certification: { ...prev.certification,
          [certField]: type === 'checkbox' ? checked : value } })) } else if (name.startsWith('cost.')) { const costField = name.split('.')[1]
      setFormData(prev => ({ ...prev,
        cost: { ...prev.cost,
          [costField]: type === 'checkbox' ? checked : value } })) } else { setFormData(prev => ({ ...prev,
        [name]: value })) } }

  const handleArrayInputChange = (field: 'prerequisites' | 'learningOutcomes', value: string) => { const items = value.split(',').map(item => item.trim()).filter(item => item)
    setFormData(prev => ({ ...prev,
      [field]: items })) }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background py-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">{'Yeni tədbir yarat'}</h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">{'Yeni tədbir yaratmaq üçün aşağıdakı məlumatları doldur.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <FormSection
            title={'Əsas Məlumatlar'}
            gradient={false}
            contentPadding="md"
            spacing="md"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Tədbir adı'}
                </label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  maxLength={200}
                  placeholder={'Tədbirin adını yaz'}
                  {...commonInputProps}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Növ'}
                </label>
                <Select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleInputChange}
                  required
                  options={[
                    { value: 'event', label: 'Tədbir' },
                    { value: 'training', label: 'Təlim' },
                    { value: 'workshop', label: 'Seminar/Çalıştay' },
                    { value: 'seminar', label: 'Seminar' }
                  ]}
                  {...commonSelectProps}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Kateqoriya'}
                </label>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  options={[
                      { value: '', label: 'Kateqoriyanı seç' },
                      ...eventCategories.map(category => ({ value: category,
                        label: category }))
                  ]}
                  {...commonSelectProps}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Maks. iştirakçı sayı'}
                </label>
                <Input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  min="1"
                  placeholder={'məs., 30'}
                  {...commonInputProps}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Təsvir'}
                </label>
                <TextArea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  maxLength={2000}
                  rows={4}
                  placeholder={'Tədbirin qısa təsvirini yaz'}
                  {...commonTextAreaProps}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Teglər'}
                </label>
                <Input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder={'Tegləri vergüllə ayır'}
                  {...commonInputProps}
                />
              </div>
            </div>
          </FormSection>

          {/* Training-specific fields */}
          {(formData.eventType === 'training' || formData.eventType === 'workshop' || formData.eventType === 'seminar') && (
            <FormSection
              title={'Təlim Məlumatları'}
              gradient={false}
              contentPadding="md"
              spacing="md"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {'Müddət'}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      name="duration.value"
                      value={formData.duration.value}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="flex-1"
                      placeholder={'Müddət'}
                      {...commonInputProps}
                    />
                    <Select
                       name="duration.unit"
                       value={formData.duration.unit}
                       onChange={handleInputChange}
                       options={[
                         { value: 'hours', label: 'Saat' },
                         { value: 'days', label: 'Gün' },
                         { value: 'weeks', label: 'Həftə' }
                       ]}
                       {...commonSelectProps}
                     />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {'Hədəf auditoriya'}
                  </label>
                  <Input
                    type="text"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    placeholder={'məs., Təşkilat heyəti, könüllülər, tələbələr'}
                    {...commonInputProps}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule
                  </label>
                    <TextArea
                    name="schedule"
                    value={formData.schedule}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder={'Cədvəl məlumatı'}
                    {...commonTextAreaProps}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prerequisites
                  </label>
                    <Input
                      type="text"
                      value={formData.prerequisites.join(', ')}
                      onChange={(e) => handleArrayInputChange('prerequisites', e.target.value)}
                      placeholder={'Tələb olunanlar (vergüllə ayrılmış)'}
                      {...commonInputProps}
                    />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Learning Outcomes
                  </label>
                    <Input
                      type="text"
                      value={formData.learningOutcomes.join(', ')}
                      onChange={(e) => handleArrayInputChange('learningOutcomes', e.target.value)}
                      placeholder={'Öyrənmə nəticələri (vergüllə ayrılmış)'}
                      {...commonInputProps}
                    />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Syllabus
                  </label>
                  <TextArea
                    name="syllabus"
                    value={formData.syllabus}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder={'Sillabus və ya gündəm'}
                    {...commonTextAreaProps}
                  />
                </div>
                
                {/* Cost Information */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{'Qiymət Məlumatı'}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="cost.isFree"
                        checked={formData.cost.isFree}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        {'Bu təlim pulsuzdur'}
                      </label>
                    </div>
                    
                    {!formData.cost.isFree && (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          name="cost.amount"
                          value={formData.cost.amount}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="flex-1"
                          placeholder={'Məbləğ'}
                          {...commonInputProps}
                        />
                        <Select
                          name="cost.currency"
                          value={formData.cost.currency}
                          onChange={handleInputChange}
                          options={[
                            { value: 'USD', label: 'USD' },
                            { value: 'EUR', label: 'EUR' },
                            { value: 'GBP', label: 'GBP' },
                            { value: 'CAD', label: 'CAD' }
                          ]}
                          {...commonSelectProps}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Certification */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{'Sertifikat'}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="certification.provided"
                        checked={formData.certification.provided}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        {'Sertifikat verilir'}
                      </label>
                    </div>
                    
                    {formData.certification.provided && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {'Sertifikat növü'}
                          </label>
                          <Input
                            type="text"
                            name="certification.type"
                            value={formData.certification.type}
                            onChange={handleInputChange}
                            placeholder={'məs., Tamamlama Sertifikatı, Peşəkar Sertifikat'}
                            {...commonInputProps}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {'Təsdiq edən'}
                          </label>
                          <Input
                            type="text"
                            name="certification.accreditedBy"
                            value={formData.certification.accreditedBy}
                            onChange={handleInputChange}
                            placeholder={'Akkreditasiya təşkilatı (ixtiyari)'}
                            {...commonInputProps}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </FormSection>
          )}

          {/* Date & Time */}
          <FormSection
            title={'Tarix və Saat'}
            icon={Calendar}
            gradient={false}
            contentPadding="md"
            spacing="md"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Başlanğıc Tarixi'}
                </label>
                <Input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  required
                  {...commonInputProps}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Bitmə Tarixi'}
                </label>
                <Input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  {...commonInputProps}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Müraciət üçün son tarix'}
                </label>
                <Input
                  type="datetime-local"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  {...commonInputProps}
                />
              </div>
            </div>
          </FormSection>

          {/* Location */}
          <FormSection
            title={'Yer'}
            icon={MapPin}
            gradient={false}
            contentPadding="md"
            spacing="md"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Yer növü'}
                </label>
                <Select
                  name="location.type"
                  value={formData.location.type}
                  onChange={handleInputChange}
                  required
                  options={[
                    { value: 'physical', label: 'Fiziki' },
                    { value: 'online', label: 'Onlayn' },
                    { value: 'hybrid', label: 'Hibrid' }
                  ]}
                  {...commonSelectProps}
                />
              </div>
              
              {(formData.location.type === 'physical' || formData.location.type === 'hybrid') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {'Ünvan'}
                    </label>
                    <Input
                      type="text"
                      name="location.address"
                      value={formData.location.address}
                      onChange={handleInputChange}
                      placeholder={'Küçə ünvanı'}
                      {...commonInputProps}
                    />
                  </div>
                  
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                      {'Şəhər'}
                    </label>
                    <Input
                      type="text"
                      name="location.city"
                      value={formData.location.city}
                      onChange={handleInputChange}
                      placeholder={'Şəhər'}
                      {...commonInputProps}
                    />
                  </div>
                  
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                      {'Ölkə'}
                    </label>
                    <Input
                      type="text"
                      name="location.country"
                      value={formData.location.country}
                      onChange={handleInputChange}
                      placeholder={'Ölkə'}
                      {...commonInputProps}
                    />
                  </div>
                </div>
              )}
              
              {(formData.location.type === 'online' || formData.location.type === 'hybrid') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {'Onlayn görüş linki'}
                  </label>
                  <Input
                    type="url"
                    name="location.onlineLink"
                    value={formData.location.onlineLink}
                    onChange={handleInputChange}
                    placeholder={'https://...'}
                    {...commonInputProps}
                  />
                </div>
              )}
            </div>
          </FormSection>

          {/* Additional Information */}
          <FormSection
            title={'Əlavə Məlumat'}
            icon={Tag}
            gradient={false}
            contentPadding="md"
            spacing="md"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Müraciət / Qeydiyyat linki'}
                </label>
                <Input
                  type="url"
                  name="applicationLink"
                  value={formData.applicationLink}
                  onChange={handleInputChange}
                  placeholder={'https://...'}
                  {...commonInputProps}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Tədbir şəkil linki'}
                </label>
                <Input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder={'https://...'}
                  {...commonInputProps}
                />
              </div>
            </div>
          </FormSection>

          {/* Submit */}
          <div className="flex justify-end gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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
            >
              {loading ? 'Yaradılır...' : 'Yoxlanış üçün göndər'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  ) }

export default function CreateEvent() { return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
      <CreateEventContent />
    </Suspense>
  ) }

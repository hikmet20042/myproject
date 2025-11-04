'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, MapPin, Users, Link as LinkIcon, Clock, Tag, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Input, Select, Button, TextArea } from '@/components/ui'
import { FormSection } from '@/components/forms'
import { useLanguage } from '@/contexts/LanguageContext'

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

function CreateEventContent() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  // Normalize field sizes for visual consistency
  const commonInputProps = { inputSize: 'md' as const }
  const commonSelectProps = { selectSize: 'md' as const }
  const commonTextAreaProps = { textAreaSize: 'md' as const }
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    eventType: 'event' as 'event' | 'training' | 'workshop' | 'seminar',
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
    imageUrl: '',
    // Training-specific fields
    duration: {
      value: '',
      unit: 'hours' as 'hours' | 'days' | 'weeks'
    },
    schedule: '',
    prerequisites: [] as string[],
    learningOutcomes: [] as string[],
    targetAudience: '',
    syllabus: '',
    certification: {
      provided: false,
      type: '',
      accreditedBy: ''
    },
    cost: {
      isFree: false,
      amount: '',
      currency: 'USD',
      scholarshipAvailable: false
    }
  })

  // Handle URL parameters for event type
  useEffect(() => {
    const typeParam = searchParams?.get('type')
    if (typeParam && ['training', 'workshop', 'seminar'].includes(typeParam)) {
      setFormData(prev => ({
        ...prev,
        eventType: typeParam as 'training' | 'workshop' | 'seminar'
      }))
    }
  }, [searchParams])



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

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/dashboard/events?created=true')
      } else {
        alert('Error creating event: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }))
    } else if (name.startsWith('duration.')) {
      const durationField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        duration: {
          ...prev.duration,
          [durationField]: value
        }
      }))
    } else if (name.startsWith('certification.')) {
      const certField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        certification: {
          ...prev.certification,
          [certField]: type === 'checkbox' ? checked : value
        }
      }))
    } else if (name.startsWith('cost.')) {
      const costField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        cost: {
          ...prev.cost,
          [costField]: type === 'checkbox' ? checked : value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleArrayInputChange = (field: 'prerequisites' | 'learningOutcomes', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item)
    setFormData(prev => ({
      ...prev,
      [field]: items
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('events.createNewTitle')}</h1>
          <p className="mt-2 text-gray-600">{t('events.createNewSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <FormSection
            title={t('events.basicInformation')}
            gradient={false}
            contentPadding="md"
            spacing="md"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.eventTitle')}
                </label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  maxLength={200}
                  placeholder={t('events.eventTitlePlaceholder')}
                  {...commonInputProps}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.eventType')}
                </label>
                <Select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleInputChange}
                  required
                  options={[
                    { value: 'event', label: t('events.type.event') },
                    { value: 'training', label: t('events.type.training') },
                    { value: 'workshop', label: t('events.type.workshop') },
                    { value: 'seminar', label: t('events.type.seminar') }
                  ]}
                  {...commonSelectProps}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.category')}
                </label>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  options={[
                      { value: '', label: t('events.selectCategory') },
                      ...eventCategories.map(category => ({
                        value: category,
                        label: t(`events.categoryOptions.${category}`)
                      }))
                  ]}
                  {...commonSelectProps}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.maxParticipants')}
                </label>
                <Input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  min="1"
                  placeholder={t('events.maxParticipantsPlaceholder')}
                  {...commonInputProps}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.description')}
                </label>
                <TextArea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  maxLength={2000}
                  rows={4}
                  placeholder={t('events.descriptionPlaceholder')}
                  {...commonTextAreaProps}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.tags')}
                </label>
                <Input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder={t('events.tagsPlaceholder')}
                  {...commonInputProps}
                />
              </div>
            </div>
          </FormSection>

          {/* Training-specific fields */}
          {(formData.eventType === 'training' || formData.eventType === 'workshop' || formData.eventType === 'seminar') && (
            <FormSection
              title={t('events.trainingDetails')}
              gradient={false}
              contentPadding="md"
              spacing="md"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('events.duration')}
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
                      placeholder={t('events.durationPlaceholder')}
                      {...commonInputProps}
                    />
                    <Select
                       name="duration.unit"
                       value={formData.duration.unit}
                       onChange={handleInputChange}
                       options={[
                         { value: 'hours', label: t('events.durationUnits.hours') },
                         { value: 'days', label: t('events.durationUnits.days') },
                         { value: 'weeks', label: t('events.durationUnits.weeks') }
                       ]}
                       {...commonSelectProps}
                     />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('events.targetAudience')}
                  </label>
                  <Input
                    type="text"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    placeholder={t('events.targetAudiencePlaceholder')}
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
                    placeholder={t('events.schedulePlaceholder')}
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
                      placeholder={t('events.prerequisitesPlaceholder')}
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
                      placeholder={t('events.learningOutcomesPlaceholder')}
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
                    placeholder={t('events.syllabusPlaceholder')}
                    {...commonTextAreaProps}
                  />
                </div>
                
                {/* Cost Information */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('events.costInformation')}</h3>
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
                        {t('events.thisTrainingIsFree')}
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
                          placeholder={t('events.amountPlaceholder')}
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
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('events.certification')}</h3>
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
                        {t('events.certificateProvided')}
                      </label>
                    </div>
                    
                    {formData.certification.provided && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('events.certificateType')}
                          </label>
                          <Input
                            type="text"
                            name="certification.type"
                            value={formData.certification.type}
                            onChange={handleInputChange}
                            placeholder="e.g., Certificate of Completion, Professional Certificate"
                            {...commonInputProps}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('events.accreditedBy')}
                          </label>
                          <Input
                            type="text"
                            name="certification.accreditedBy"
                            value={formData.certification.accreditedBy}
                            onChange={handleInputChange}
                            placeholder="Accrediting organization (optional)"
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
            title={t('events.dateTime')}
            icon={Calendar}
            gradient={false}
            contentPadding="md"
            spacing="md"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.startDate')}
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
                  {t('events.endDate')}
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
                  {t('events.applicationDeadline')}
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
            title={t('events.locationLabel')}
            icon={MapPin}
            gradient={false}
            contentPadding="md"
            spacing="md"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.locationType')}
                </label>
                <Select
                  name="location.type"
                  value={formData.location.type}
                  onChange={handleInputChange}
                  required
                  options={[
                    { value: 'physical', label: t('events.locationTypes.physical') },
                    { value: 'online', label: t('events.locationTypes.online') },
                    { value: 'hybrid', label: t('events.locationTypes.hybrid') }
                  ]}
                  {...commonSelectProps}
                />
              </div>
              
              {(formData.location.type === 'physical' || formData.location.type === 'hybrid') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('events.address')}
                    </label>
                    <Input
                      type="text"
                      name="location.address"
                      value={formData.location.address}
                      onChange={handleInputChange}
                      placeholder={t('events.addressPlaceholder')}
                      {...commonInputProps}
                    />
                  </div>
                  
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('events.city')}
                    </label>
                    <Input
                      type="text"
                      name="location.city"
                      value={formData.location.city}
                      onChange={handleInputChange}
                      placeholder={t('events.cityPlaceholder')}
                      {...commonInputProps}
                    />
                  </div>
                  
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('events.country')}
                    </label>
                    <Input
                      type="text"
                      name="location.country"
                      value={formData.location.country}
                      onChange={handleInputChange}
                      placeholder={t('events.countryPlaceholder')}
                      {...commonInputProps}
                    />
                  </div>
                </div>
              )}
              
              {(formData.location.type === 'online' || formData.location.type === 'hybrid') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('events.onlineLink')}
                  </label>
                  <Input
                    type="url"
                    name="location.onlineLink"
                    value={formData.location.onlineLink}
                    onChange={handleInputChange}
                    placeholder={t('events.onlineLinkPlaceholder')}
                    {...commonInputProps}
                  />
                </div>
              )}
            </div>
          </FormSection>

          {/* Additional Information */}
          <FormSection
            title={t('events.additionalInformation')}
            icon={Tag}
            gradient={false}
            contentPadding="md"
            spacing="md"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.applicationLink')}
                </label>
                <Input
                  type="url"
                  name="applicationLink"
                  value={formData.applicationLink}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  {...commonInputProps}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.imageUrl')}
                </label>
                <Input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  {...commonInputProps}
                />
              </div>
            </div>
          </FormSection>

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
            >
              {loading ? t('events.creating') : t('events.submitForReview')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CreateEvent() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <CreateEventContent />
    </Suspense>
  )
}
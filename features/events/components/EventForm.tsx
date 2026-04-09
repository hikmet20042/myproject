'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Loader2, Tag } from 'lucide-react'
import { Input, Select, Button, TextArea } from '@/components/ui'
import { FormSection } from '@/components/forms'
import ContentForm from '@/features/forms/ContentForm'
import {
  eventBasicInfoSchema,
  type EventBasicInfoData,
} from '@/features/forms/schema/event.schema'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'

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
  'other',
]

type EventTypeValue = 'event' | 'training' | 'workshop' | 'seminar'
type LocationType = 'online' | 'physical' | 'hybrid'

type EventFormData = {
  title: string
  description: string
  category: string
  eventType: EventTypeValue
  eventDate: string
  endDate: string
  location: {
    type: LocationType
    address: string
    city: string
    country: string
    onlineLink: string
  }
  applicationLink: string
  applicationDeadline: string
  maxParticipants: string
  tags: string
  imageUrl: string
  duration: {
    value: string
    unit: 'hours' | 'days' | 'weeks'
  }
  schedule: string
  prerequisites: string[]
  learningOutcomes: string[]
  targetAudience: string
  syllabus: string
  certification: {
    provided: boolean
    type: string
    accreditedBy: string
  }
  cost: {
    isFree: boolean
    amount: string
    currency: string
    scholarshipAvailable: boolean
  }
}

export type EventFormInitialData = Partial<EventFormData> & {
  _id?: string
  id?: string
  status?: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  adminComment?: string
}

export type EventFormSubmitPayload = {
  title: string
  description: string
  category: string
  eventType: EventTypeValue
  eventDate: string
  endDate?: string
  location: EventFormData['location']
  applicationLink?: string
  applicationDeadline?: string
  maxParticipants?: number
  tags: string[]
  imageUrl?: string
  duration: EventFormData['duration']
  schedule?: string
  prerequisites: string[]
  learningOutcomes: string[]
  targetAudience?: string
  syllabus?: string
  certification: EventFormData['certification']
  cost: {
    isFree: boolean
    amount?: number
    currency: string
    scholarshipAvailable: boolean
  }
}

type EventFormProps = {
  isEditMode: boolean
  initialData?: EventFormInitialData | null
  defaultEventType?: EventTypeValue
  onSubmit: (payload: EventFormSubmitPayload) => Promise<void>
}

const INITIAL_EVENT_FORM_DATA: EventFormData = {
  title: '',
  description: '',
  category: '',
  eventType: 'event',
  eventDate: '',
  endDate: '',
  location: {
    type: 'physical',
    address: '',
    city: '',
    country: '',
    onlineLink: '',
  },
  applicationLink: '',
  applicationDeadline: '',
  maxParticipants: '',
  tags: '',
  imageUrl: '',
  duration: {
    value: '',
    unit: 'hours',
  },
  schedule: '',
  prerequisites: [],
  learningOutcomes: [],
  targetAudience: '',
  syllabus: '',
  certification: {
    provided: false,
    type: '',
    accreditedBy: '',
  },
  cost: {
    isFree: false,
    amount: '',
    currency: 'USD',
    scholarshipAvailable: false,
  },
}

const toDateInput = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const toDateTimeInput = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 16)
}

export default function EventForm({
  isEditMode,
  initialData,
  defaultEventType = 'event',
  onSubmit,
}: EventFormProps) {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { showError } = useGlobalFeedback()
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [draftSaveState, setDraftSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [draftSavedAt, setDraftSavedAt] = useState<string>('')
  const EVENT_DRAFT_KEY = 'event_create_draft_v1'
  const [formData, setFormData] = useState<EventFormData>({
    ...INITIAL_EVENT_FORM_DATA,
    eventType: defaultEventType,
  })

  const commonInputProps = { inputSize: 'md' as const }
  const commonSelectProps = { selectSize: 'md' as const }
  const commonTextAreaProps = { textAreaSize: 'md' as const }

  useEffect(() => {
    if (isEditMode) {
      if (!initialData) return
      setFormData({
        ...INITIAL_EVENT_FORM_DATA,
        ...initialData,
        eventType: initialData.eventType || 'event',
        eventDate: toDateInput(initialData.eventDate),
        endDate: toDateInput(initialData.endDate),
        applicationDeadline: toDateTimeInput(initialData.applicationDeadline),
        maxParticipants:
          typeof initialData.maxParticipants === 'number'
            ? String(initialData.maxParticipants)
            : (initialData.maxParticipants || ''),
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : (initialData.tags || ''),
        location: {
          ...INITIAL_EVENT_FORM_DATA.location,
          ...(initialData.location || {}),
        },
        duration: {
          ...INITIAL_EVENT_FORM_DATA.duration,
          ...(initialData.duration || {}),
        },
        certification: {
          ...INITIAL_EVENT_FORM_DATA.certification,
          ...(initialData.certification || {}),
        },
        cost: {
          ...INITIAL_EVENT_FORM_DATA.cost,
          ...(initialData.cost || {}),
          amount:
            typeof initialData.cost?.amount === 'number'
              ? String(initialData.cost.amount)
              : (initialData.cost?.amount || ''),
        },
        prerequisites: Array.isArray(initialData.prerequisites) ? initialData.prerequisites : [],
        learningOutcomes: Array.isArray(initialData.learningOutcomes) ? initialData.learningOutcomes : [],
      })
      return
    }

    try {
      const raw = localStorage.getItem(EVENT_DRAFT_KEY)
      if (!raw) {
        setFormData({
          ...INITIAL_EVENT_FORM_DATA,
          eventType: defaultEventType,
        })
        return
      }
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return
      setFormData((prev) => ({
        ...prev,
        ...parsed,
        eventType: parsed.eventType || defaultEventType,
        location: { ...prev.location, ...(parsed.location || {}) },
        duration: { ...prev.duration, ...(parsed.duration || {}) },
        certification: { ...prev.certification, ...(parsed.certification || {}) },
        cost: { ...prev.cost, ...(parsed.cost || {}) },
      }))
    } catch {
      return
    }
  }, [defaultEventType, initialData, isEditMode])

  useEffect(() => {
    if (isEditMode) return
    setDraftSaveState('saving')
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(EVENT_DRAFT_KEY, JSON.stringify(formData))
        setDraftSaveState('saved')
        setDraftSavedAt(new Date().toLocaleTimeString())
      } catch {
        setDraftSaveState('idle')
      }
    }, 700)
    return () => clearTimeout(timer)
  }, [formData, isEditMode])

  const setInlineError = (field: string, message: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: message }))

  const clearInlineError = (field: string) =>
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })

  const sectionStatus = useMemo(() => {
    const hasBasicInfo = Boolean(formData.title.trim() && formData.description.trim())
    const hasLocation =
      formData.location.type === 'online'
        ? Boolean(formData.location.onlineLink)
        : formData.location.type === 'physical'
          ? Boolean(formData.location.address)
          : Boolean(formData.location.address && formData.location.onlineLink)
    const hasLogistics = Boolean(formData.eventDate && hasLocation)
    const hasRequirements = Boolean(formData.eventType && formData.category)
    const hasOptionalExtras = Boolean(formData.applicationLink || formData.imageUrl || formData.tags)
    const sections = [
      { label: 'Əsas məlumatlar', complete: hasBasicInfo },
      { label: 'Logistika', complete: hasLogistics },
      { label: 'Tələblər və detallar', complete: hasRequirements },
      { label: 'Əlavə məlumatlar', complete: hasOptionalExtras },
    ]
    const completed = sections.filter((section) => section.complete).length
    const activeIndex = sections.findIndex((section) => !section.complete)
    return {
      sections,
      completed,
      total: sections.length,
      current: (activeIndex === -1 ? sections.length - 1 : activeIndex) + 1,
      percent: Math.round((completed / sections.length) * 100),
    }
  }, [formData])

  const validateBeforeSubmit = () => {
    const nextErrors: Record<string, string> = {}
    if (!formData.title.trim()) nextErrors.title = 'Başlıq tələb olunur.'
    if (!formData.description.trim()) nextErrors.description = 'Təsvir tələb olunur.'
    if (!formData.category) nextErrors.category = 'Kateqoriya seçin.'
    if (!formData.eventDate) nextErrors.eventDate = 'Başlanğıc tarixi seçin.'
    if (!formData.location.type) nextErrors['location.type'] = 'Yer növünü seçin.'
    if (
      (formData.location.type === 'online' || formData.location.type === 'hybrid') &&
      !formData.location.onlineLink
    ) {
      nextErrors['location.onlineLink'] = 'Onlayn link tələb olunur.'
    }
    if (
      (formData.location.type === 'physical' || formData.location.type === 'hybrid') &&
      !formData.location.address
    ) {
      nextErrors['location.address'] = 'Fiziki ünvan tələb olunur.'
    }
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      showError('Zəhmət olmasa məcburi sahələri düzgün doldurun.')
      return false
    }
    return true
  }

  const mapApiErrorToField = (message: string) => {
    const text = message.toLowerCase()
    if (text.includes('title')) setInlineError('title', message)
    if (text.includes('description')) setInlineError('description', message)
    if (text.includes('category')) setInlineError('category', message)
    if (text.includes('event date') || text.includes('event_date')) setInlineError('eventDate', message)
    if (text.includes('location')) setInlineError('location.type', message)
    if (text.includes('online')) setInlineError('location.onlineLink', message)
    if (text.includes('address')) setInlineError('location.address', message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateBeforeSubmit()) return
    setLoading(true)
    try {
      const payload: EventFormSubmitPayload = {
        ...formData,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants, 10) : undefined,
        tags: formData.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag),
        eventDate: new Date(formData.eventDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        applicationDeadline: formData.applicationDeadline
          ? new Date(formData.applicationDeadline).toISOString()
          : undefined,
        cost: {
          ...formData.cost,
          amount: formData.cost.amount ? Number(formData.cost.amount) : undefined,
        },
      }

      await onSubmit(payload)
      if (!isEditMode) {
        localStorage.removeItem(EVENT_DRAFT_KEY)
      }
    } catch (error: any) {
      mapApiErrorToField(error?.message || '')
      showError(error?.message || (isEditMode ? 'Tədbir yenilənmədi' : 'Tədbir yaradılmadı'))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, [locationField]: value },
      }))
      clearInlineError(name)
      return
    }

    if (name.startsWith('duration.')) {
      const durationField = name.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        duration: { ...prev.duration, [durationField]: value },
      }))
      return
    }

    if (name.startsWith('certification.')) {
      const certField = name.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        certification: { ...prev.certification, [certField]: type === 'checkbox' ? checked : value },
      }))
      return
    }

    if (name.startsWith('cost.')) {
      const costField = name.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        cost: { ...prev.cost, [costField]: type === 'checkbox' ? checked : value },
      }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
    clearInlineError(name)
  }

  const handleArrayInputChange = (field: 'prerequisites' | 'learningOutcomes', value: string) => {
    const items = value.split(',').map((item) => item.trim()).filter((item) => item)
    setFormData((prev) => ({ ...prev, [field]: items }))
  }

  const handleBasicInfoSync = (data: EventBasicInfoData) => {
    setFormData((prev) => ({
      ...prev,
      title: data.title || '',
      description: data.description || '',
    }))
    clearInlineError('title')
    clearInlineError('description')
  }

  const moderationReason = initialData?.rejectionReason || initialData?.adminComment || null

  return (
    <div className="relative min-h-screen overflow-hidden bg-background py-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">
            {isEditMode ? 'Tədbiri redaktə et' : 'Yeni tədbir yarat'}
          </h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            {isEditMode
              ? 'Məlumatları yeniləyin və tədbiri yenidən baxış üçün göndərin.'
              : 'Yeni tədbir yaratmaq üçün aşağıdakı məlumatları doldur.'}
          </p>
          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
              <span>{`Bölmə ${sectionStatus.current} / ${sectionStatus.total}`}</span>
              <span>{`${sectionStatus.percent}%`}</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${sectionStatus.percent}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {sectionStatus.sections.map((section) => (
                <span
                  key={section.label}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    section.complete ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {section.complete ? '✓ ' : ''}{section.label}
                </span>
              ))}
            </div>
            {!isEditMode && (
              <p className="mt-2 text-xs text-gray-500">
                {draftSaveState === 'saving' ? 'Qaralama saxlanılır...' : draftSaveState === 'saved' ? `Qaralama saxlanıldı: ${draftSavedAt}` : ''}
              </p>
            )}
          </div>
        </div>

        {isEditMode && initialData?.status === 'approved' && (
          <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
            {'Redaktədən sonra tədbirin statusu yenidən "pending" olacaq və yayımdan çıxarılacaq.'}
          </div>
        )}
        {isEditMode && initialData?.status === 'pending' && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            {'Tədbir hələ yoxlanışdadır. Dəyişikliklər moderasiya üçün yenilənəcək.'}
          </div>
        )}
        {isEditMode && initialData?.status === 'rejected' && moderationReason && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              <strong>{'Əvvəlki rədd səbəbi:'}</strong> {moderationReason}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <FormSection title={'Əsas məlumatlar'} gradient={false} contentPadding="md" spacing="md">
            <div className="grid grid-cols-1 gap-6">
              <ContentForm<EventBasicInfoData>
                schema={eventBasicInfoSchema}
                initialData={{
                  title: formData.title,
                  description: formData.description,
                }}
                onChange={handleBasicInfoSync}
                onSubmit={async (data) => {
                  handleBasicInfoSync(data)
                }}
                showSubmitButton={false}
                asForm={false}
              />
              {fieldErrors.title && <p className="text-sm text-red-600">{fieldErrors.title}</p>}
              {fieldErrors.description && <p className="text-sm text-red-600">{fieldErrors.description}</p>}
            </div>
          </FormSection>

          <FormSection title={'Tələblər və detallar'} gradient={false} contentPadding="md" spacing="md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{'Növ'}</label>
                <Select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleInputChange}
                  required
                  options={[
                    { value: 'event', label: 'Tədbir' },
                    { value: 'training', label: 'Təlim' },
                    { value: 'workshop', label: 'Seminar/Çalıştay' },
                    { value: 'seminar', label: 'Seminar' },
                  ]}
                  {...commonSelectProps}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{'Kateqoriya'}</label>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  placeholder={'Kateqoriyanı seç'}
                  options={eventCategories.map((category) => ({ value: category, label: category }))}
                  {...commonSelectProps}
                />
                {fieldErrors.category && <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{'Maks. iştirakçı sayı'}</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">{'Teglər'}</label>
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

          {(formData.eventType === 'training' || formData.eventType === 'workshop' || formData.eventType === 'seminar') && (
            <FormSection title={'Təlim Məlumatları'} gradient={false} contentPadding="md" spacing="md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{'Müddət'}</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      name="duration.value"
                      value={formData.duration.value}
                      onChange={handleInputChange}
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
                        { value: 'weeks', label: 'Həftə' },
                      ]}
                      {...commonSelectProps}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{'Hədəf auditoriya'}</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cədvəl</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">İlkin tələblər</label>
                  <Input
                    type="text"
                    value={formData.prerequisites.join(', ')}
                    onChange={(e) => handleArrayInputChange('prerequisites', e.target.value)}
                    placeholder={'Tələb olunanlar (vergüllə ayrılmış)'}
                    {...commonInputProps}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Öyrənmə nəticələri</label>
                  <Input
                    type="text"
                    value={formData.learningOutcomes.join(', ')}
                    onChange={(e) => handleArrayInputChange('learningOutcomes', e.target.value)}
                    placeholder={'Öyrənmə nəticələri (vergüllə ayrılmış)'}
                    {...commonInputProps}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sillabus</label>
                  <TextArea
                    name="syllabus"
                    value={formData.syllabus}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder={'Sillabus və ya gündəm'}
                    {...commonTextAreaProps}
                  />
                </div>
              </div>
            </FormSection>
          )}

          <FormSection title={'Logistika'} icon={Calendar} gradient={false} contentPadding="md" spacing="md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{'Başlanğıc Tarixi'}</label>
                <Input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  required
                  {...commonInputProps}
                />
                {fieldErrors.eventDate && <p className="mt-1 text-sm text-red-600">{fieldErrors.eventDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{'Bitmə Tarixi'}</label>
                <Input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  {...commonInputProps}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{'Müraciət üçün son tarix'}</label>
                <Input
                  type="datetime-local"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  {...commonInputProps}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{'Yer növü'}</label>
                <Select
                  name="location.type"
                  value={formData.location.type}
                  onChange={handleInputChange}
                  required
                  options={[
                    { value: 'physical', label: 'Fiziki' },
                    { value: 'online', label: 'Onlayn' },
                    { value: 'hybrid', label: 'Hibrid' },
                  ]}
                  {...commonSelectProps}
                />
                {fieldErrors['location.type'] && <p className="mt-1 text-sm text-red-600">{fieldErrors['location.type']}</p>}
              </div>
              {(formData.location.type === 'physical' || formData.location.type === 'hybrid') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{'Ünvan'}</label>
                    <Input
                      type="text"
                      name="location.address"
                      value={formData.location.address}
                      onChange={handleInputChange}
                      placeholder={'Küçə ünvanı'}
                      {...commonInputProps}
                    />
                    {fieldErrors['location.address'] && <p className="mt-1 text-sm text-red-600">{fieldErrors['location.address']}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{'Şəhər'}</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">{'Ölkə'}</label>
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{'Onlayn görüş linki'}</label>
                  <Input
                    type="url"
                    name="location.onlineLink"
                    value={formData.location.onlineLink}
                    onChange={handleInputChange}
                    placeholder={'https://...'}
                    {...commonInputProps}
                  />
                  {fieldErrors['location.onlineLink'] && <p className="mt-1 text-sm text-red-600">{fieldErrors['location.onlineLink']}</p>}
                </div>
              )}
            </div>
          </FormSection>

          <FormSection title={'Əlavə məlumatlar'} icon={Tag} gradient={false} contentPadding="md" spacing="md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{'Müraciət / Qeydiyyat linki'}</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">{'Tədbir şəkil linki'}</label>
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

          <div className="flex justify-end gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <Button type="button" onClick={() => router.push(localePath('/dashboard/events'))} variant="outline">
              {'Ləğv et'}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditMode ? 'Yenilənir...' : 'Yaradılır...'}
                </span>
              ) : isEditMode ? (
                'Tədbiri yenilə'
              ) : (
                'Yoxlanış üçün göndər'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

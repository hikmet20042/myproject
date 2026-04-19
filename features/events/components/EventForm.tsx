'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Loader2, Plus, Tag, Trash2 } from 'lucide-react'
import { Input, Select, Button, TextArea } from '@/components/ui'
import { FormSection } from '@/components/forms'
import ContentForm from '@/features/forms/ContentForm'
import {
  eventBasicInfoSchema,
  type EventBasicInfoData,
} from '@/features/forms/schema/event.schema'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import {
  AZERBAIJAN_CITIES,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_VALUES,
  type EventSession,
  type EventTypeValue,
} from '@/lib/events/eventConfig'

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

type LocationType = 'online' | 'physical' | 'hybrid'

type EventFormData = {
  title: string
  description: string
  category: string
  eventType: EventTypeValue
  sessions: EventSession[]
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
  audienceAgeMin: string
  audienceAgeMax: string
  certificationProvided: boolean
  requirements: string[]
  participantBenefits: string[]
}

export type EventFormInitialData = Partial<EventFormData> & {
  _id?: string
  id?: string
  status?: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  adminComment?: string
  eventDate?: string
  endDate?: string
  certification?: { provided?: boolean }
  certificationProvided?: boolean
}

export type EventFormSubmitPayload = {
  title: string
  description: string
  category: string
  eventType: EventTypeValue
  eventDate: string
  endDate: string
  sessions: EventSession[]
  location: EventFormData['location']
  applicationLink: string
  applicationDeadline?: string
  maxParticipants?: number
  tags: string[]
  imageUrl?: string
  audienceAgeMin: number
  audienceAgeMax: number
  certification: {
    provided: boolean
  }
  requirements: string[]
  participantBenefits: string[]
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
  eventType: 'training_workshop',
  sessions: [{ date: '', startTime: '', endTime: '' }],
  location: {
    type: 'physical',
    address: '',
    city: '',
    country: 'Azərbaycan',
    onlineLink: '',
  },
  applicationLink: '',
  applicationDeadline: '',
  maxParticipants: '',
  tags: '',
  imageUrl: '',
  audienceAgeMin: '',
  audienceAgeMax: '',
  certificationProvided: false,
  requirements: [],
  participantBenefits: [],
}

const toDateTimeInput = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 16)
}

const toDateInput = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const toTimeInput = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(11, 16)
}

const categoryLabel = (value: string) =>
  value
    .split('_')
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ')

const sessionToIso = (session: EventSession, key: 'startTime' | 'endTime') =>
  new Date(`${session.date}T${session[key]}:00`).toISOString()

const sortSessions = (sessions: EventSession[]) =>
  [...sessions].sort((left, right) => {
    const leftDate = new Date(`${left.date}T${left.startTime}:00`).getTime()
    const rightDate = new Date(`${right.date}T${right.startTime}:00`).getTime()
    return leftDate - rightDate
  })

export default function EventForm({
  isEditMode,
  initialData,
  defaultEventType = 'training_workshop',
  onSubmit,
}: EventFormProps) {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { showError } = useGlobalFeedback()
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [draftSaveState, setDraftSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [draftSavedAt, setDraftSavedAt] = useState<string>('')
  const [requirementInput, setRequirementInput] = useState('')
  const [benefitInput, setBenefitInput] = useState('')
  const EVENT_DRAFT_KEY = 'event_create_draft_v2'
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

      const initialSessions =
        Array.isArray(initialData.sessions) && initialData.sessions.length > 0
          ? initialData.sessions
          : initialData.eventDate
            ? [
                {
                  date: toDateInput(initialData.eventDate),
                  startTime: toTimeInput(initialData.eventDate),
                  endTime: toTimeInput(initialData.endDate || initialData.eventDate),
                },
              ]
            : INITIAL_EVENT_FORM_DATA.sessions

      const safeEventType = EVENT_TYPE_VALUES.includes(initialData.eventType as EventTypeValue)
        ? (initialData.eventType as EventTypeValue)
        : 'training_workshop'

      setFormData({
        ...INITIAL_EVENT_FORM_DATA,
        ...initialData,
        eventType: safeEventType,
        sessions: initialSessions.map((session) => ({
          date: session.date || '',
          startTime: session.startTime || '',
          endTime: session.endTime || '',
        })),
        applicationDeadline: toDateTimeInput(initialData.applicationDeadline),
        maxParticipants:
          typeof initialData.maxParticipants === 'number'
            ? String(initialData.maxParticipants)
            : (initialData.maxParticipants || ''),
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : (initialData.tags || ''),
        audienceAgeMin:
          typeof initialData.audienceAgeMin === 'number'
            ? String(initialData.audienceAgeMin)
            : (initialData.audienceAgeMin || ''),
        audienceAgeMax:
          typeof initialData.audienceAgeMax === 'number'
            ? String(initialData.audienceAgeMax)
            : (initialData.audienceAgeMax || ''),
        certificationProvided: Boolean(initialData.certificationProvided || initialData.certification?.provided),
        requirements: Array.isArray(initialData.requirements) ? initialData.requirements : [],
        participantBenefits: Array.isArray(initialData.participantBenefits) ? initialData.participantBenefits : [],
        location: {
          ...INITIAL_EVENT_FORM_DATA.location,
          ...(initialData.location || {}),
        },
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
        eventType: EVENT_TYPE_VALUES.includes(parsed.eventType) ? parsed.eventType : defaultEventType,
        location: { ...prev.location, ...(parsed.location || {}) },
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
    const hasSessions = formData.sessions.every((session) => session.date && session.startTime && session.endTime)
    const hasLocation =
      formData.location.type === 'online'
        ? Boolean(formData.location.onlineLink)
        : formData.location.type === 'physical'
          ? Boolean(formData.location.address && formData.location.city)
          : Boolean(formData.location.address && formData.location.city && formData.location.onlineLink)
    const hasAudience = Boolean(formData.audienceAgeMin !== '' && formData.audienceAgeMax !== '')
    const hasOptionalExtras = Boolean(formData.applicationLink || formData.imageUrl || formData.tags)
    const sections = [
      { label: 'Əsas məlumatlar', complete: hasBasicInfo },
      { label: 'Logistika', complete: hasSessions && hasLocation },
      { label: 'Profil və tələblər', complete: hasAudience },
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
    if (!formData.eventType) nextErrors.eventType = 'Növ seçin.'

    if (!Array.isArray(formData.sessions) || formData.sessions.length === 0) {
      nextErrors.sessions = 'Ən azı bir sessiya əlavə edin.'
    }

    formData.sessions.forEach((session, index) => {
      if (!session.date || !session.startTime || !session.endTime) {
        nextErrors[`sessions.${index}`] = 'Sessiya üçün tarix və saatlar tələb olunur.'
      }
      if (session.startTime && session.endTime && session.startTime >= session.endTime) {
        nextErrors[`sessions.${index}`] = 'Sessiya başlanğıcı bitmə saatından kiçik olmalıdır.'
      }
    })

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
    if (
      (formData.location.type === 'physical' || formData.location.type === 'hybrid') &&
      !formData.location.city
    ) {
      nextErrors['location.city'] = 'Şəhər seçimi tələb olunur.'
    }
    if (!formData.applicationLink.trim()) {
      nextErrors.applicationLink = 'Müraciət linki tələb olunur.'
    }

    const ageMin = Number(formData.audienceAgeMin)
    const ageMax = Number(formData.audienceAgeMax)
    if (formData.audienceAgeMin === '' || formData.audienceAgeMax === '') {
      nextErrors.audienceAge = 'Yaş aralığı tələb olunur.'
    } else if (!Number.isInteger(ageMin) || !Number.isInteger(ageMax)) {
      nextErrors.audienceAge = 'Yaş aralığı tam ədədlərdən ibarət olmalıdır.'
    } else if (ageMin < 0 || ageMax > 99 || ageMin > ageMax) {
      nextErrors.audienceAge = 'Yaş aralığı 0-99 intervalında və düzgün sıra ilə olmalıdır.'
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
    if (text.includes('event type')) setInlineError('eventType', message)
    if (text.includes('session')) setInlineError('sessions', message)
    if (text.includes('location')) setInlineError('location.type', message)
    if (text.includes('online')) setInlineError('location.onlineLink', message)
    if (text.includes('address')) setInlineError('location.address', message)
    if (text.includes('city')) setInlineError('location.city', message)
    if (text.includes('applicationlink') || text.includes('application link')) setInlineError('applicationLink', message)
    if (text.includes('age')) setInlineError('audienceAge', message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateBeforeSubmit()) return
    setLoading(true)
    try {
      const normalizedSessions = sortSessions(
        formData.sessions
          .map((session) => ({
            date: session.date,
            startTime: session.startTime,
            endTime: session.endTime,
          }))
          .filter((session) => session.date && session.startTime && session.endTime),
      )

      const payload: EventFormSubmitPayload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        eventType: formData.eventType,
        eventDate: sessionToIso(normalizedSessions[0], 'startTime'),
        endDate: sessionToIso(normalizedSessions[normalizedSessions.length - 1], 'endTime'),
        sessions: normalizedSessions,
        location: {
          ...formData.location,
          address: formData.location.address.trim(),
          city: formData.location.city.trim(),
          country: formData.location.country.trim() || 'Azərbaycan',
          onlineLink: formData.location.onlineLink.trim(),
        },
        applicationLink: formData.applicationLink.trim(),
        applicationDeadline: formData.applicationDeadline
          ? new Date(formData.applicationDeadline).toISOString()
          : undefined,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants, 10) : undefined,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        imageUrl: formData.imageUrl.trim() || undefined,
        audienceAgeMin: Number(formData.audienceAgeMin),
        audienceAgeMax: Number(formData.audienceAgeMax),
        certification: {
          provided: formData.certificationProvided,
        },
        requirements: formData.requirements,
        participantBenefits: formData.participantBenefits,
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

    if (name === 'certificationProvided') {
      setFormData((prev) => ({ ...prev, certificationProvided: type === 'checkbox' ? checked : Boolean(value) }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
    clearInlineError(name)
  }

  const handleSessionChange = (index: number, field: keyof EventSession, value: string) => {
    setFormData((prev) => {
      const nextSessions = [...prev.sessions]
      nextSessions[index] = {
        ...nextSessions[index],
        [field]: value,
      }
      return { ...prev, sessions: nextSessions }
    })
    clearInlineError(`sessions.${index}`)
    clearInlineError('sessions')
  }

  const addSession = () => {
    setFormData((prev) => ({
      ...prev,
      sessions: [...prev.sessions, { date: '', startTime: '', endTime: '' }],
    }))
  }

  const removeSession = (index: number) => {
    setFormData((prev) => {
      if (prev.sessions.length === 1) return prev
      return {
        ...prev,
        sessions: prev.sessions.filter((_, itemIndex) => itemIndex !== index),
      }
    })
  }

  const addListItem = (field: 'requirements' | 'participantBenefits', value: string) => {
    const normalized = value.trim()
    if (!normalized) return
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], normalized],
    }))
  }

  const removeListItem = (field: 'requirements' | 'participantBenefits', index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, itemIndex) => itemIndex !== index),
    }))
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
                  {section.complete ? '✓ ' : ''}
                  {section.label}
                </span>
              ))}
            </div>
            {!isEditMode && (
              <p className="mt-2 text-xs text-gray-500">
                {draftSaveState === 'saving'
                  ? 'Qaralama saxlanılır...'
                  : draftSaveState === 'saved'
                    ? `Qaralama saxlanıldı: ${draftSavedAt}`
                    : ''}
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
                  options={EVENT_TYPE_VALUES.map((eventType) => ({
                    value: eventType,
                    label: EVENT_TYPE_LABELS[eventType],
                  }))}
                  {...commonSelectProps}
                />
                {fieldErrors.eventType && <p className="mt-1 text-sm text-red-600">{fieldErrors.eventType}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{'Kateqoriya'}</label>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  placeholder={'Kateqoriyanı seç'}
                  options={eventCategories.map((category) => ({
                    value: category,
                    label: categoryLabel(category),
                  }))}
                  {...commonSelectProps}
                />
                {fieldErrors.category && <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{'Maksimum iştirakçı sayı (statik)'}</label>
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

          <FormSection title={'Logistika'} icon={Calendar} gradient={false} contentPadding="md" spacing="md">
            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Sessiyalar</label>
                  <Button type="button" variant="outline" size="sm" icon={Plus} iconPosition="left" onClick={addSession}>
                    Sessiya əlavə et
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.sessions.map((session, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 rounded-xl border border-gray-200 p-3">
                      <Input
                        type="date"
                        value={session.date}
                        onChange={(e) => handleSessionChange(index, 'date', e.target.value)}
                        {...commonInputProps}
                      />
                      <Input
                        type="time"
                        value={session.startTime}
                        onChange={(e) => handleSessionChange(index, 'startTime', e.target.value)}
                        {...commonInputProps}
                      />
                      <Input
                        type="time"
                        value={session.endTime}
                        onChange={(e) => handleSessionChange(index, 'endTime', e.target.value)}
                        {...commonInputProps}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-full"
                        onClick={() => removeSession(index)}
                        disabled={formData.sessions.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {fieldErrors[`sessions.${index}`] && (
                        <p className="md:col-span-4 text-sm text-red-600">{fieldErrors[`sessions.${index}`]}</p>
                      )}
                    </div>
                  ))}
                </div>
                {fieldErrors.sessions && <p className="mt-2 text-sm text-red-600">{fieldErrors.sessions}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <Select
                        name="location.city"
                        value={formData.location.city}
                        onChange={handleInputChange}
                        placeholder={'Şəhəri seç'}
                        options={AZERBAIJAN_CITIES.map((city) => ({ value: city, label: city }))}
                        {...commonSelectProps}
                      />
                      {fieldErrors['location.city'] && <p className="mt-1 text-sm text-red-600">{fieldErrors['location.city']}</p>}
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
            </div>
          </FormSection>

          <FormSection title={'Profil və tələblər'} gradient={false} contentPadding="md" spacing="md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{'Yaş aralığı (min)'}</label>
                <Input
                  type="number"
                  name="audienceAgeMin"
                  min="0"
                  max="99"
                  value={formData.audienceAgeMin}
                  onChange={handleInputChange}
                  {...commonInputProps}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{'Yaş aralığı (max)'}</label>
                <Input
                  type="number"
                  name="audienceAgeMax"
                  min="0"
                  max="99"
                  value={formData.audienceAgeMax}
                  onChange={handleInputChange}
                  {...commonInputProps}
                />
              </div>
              {fieldErrors.audienceAge && <p className="md:col-span-2 text-sm text-red-600">{fieldErrors.audienceAge}</p>}

              <div className="md:col-span-2 flex items-center gap-2 rounded-xl border border-gray-200 p-3">
                <input
                  id="certificationProvided"
                  type="checkbox"
                  name="certificationProvided"
                  checked={formData.certificationProvided}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="certificationProvided" className="text-sm font-medium text-gray-700">
                  İştirakçılara sertifikat verilir
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tələblər</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    placeholder={'Yeni tələb əlavə edin'}
                    {...commonInputProps}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      addListItem('requirements', requirementInput)
                      setRequirementInput('')
                    }}
                  >
                    Əlavə et
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.requirements.map((item, index) => (
                    <button
                      type="button"
                      key={`${item}-${index}`}
                      onClick={() => removeListItem('requirements', index)}
                      className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700"
                    >
                      {item} ×
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">İştirakçı faydaları</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    placeholder={'Yeni fayda əlavə edin'}
                    {...commonInputProps}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      addListItem('participantBenefits', benefitInput)
                      setBenefitInput('')
                    }}
                  >
                    Əlavə et
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.participantBenefits.map((item, index) => (
                    <button
                      type="button"
                      key={`${item}-${index}`}
                      onClick={() => removeListItem('participantBenefits', index)}
                      className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700"
                    >
                      {item} ×
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title={'Əlavə məlumatlar'} icon={Tag} gradient={false} contentPadding="md" spacing="md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{'Xarici müraciət linki *'}</label>
                <Input
                  type="url"
                  name="applicationLink"
                  value={formData.applicationLink}
                  onChange={handleInputChange}
                  required
                  placeholder={'https://...'}
                  {...commonInputProps}
                />
                {fieldErrors.applicationLink && <p className="mt-1 text-sm text-red-600">{fieldErrors.applicationLink}</p>}
                <p className="mt-1 text-xs text-gray-500">{'İstifadəçilər bu linkə yönləndirilir, müraciət platformadan kənarda aparılır.'}</p>
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

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, Calendar, Loader2, Phone, Plus, Trash2, Upload } from 'lucide-react'
import { Button, Input, Select, TextArea } from '@/components/ui'
import { useFormState } from '@/features/forms/useFormState'
import { buildVacancySubmitPayload } from '@/features/forms/payloadBuilders/vacancy'
import { validateVacancyForm } from '@/features/forms/validation/vacancy'
import {
  type VacancyFormData,
  type VacancyFormInitialData,
  type VacancyFormSubmitPayload,
  INITIAL_VACANCY_FORM_DATA,
} from '@/features/vacancies/types/form'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import {
  getYearOptions,
  isInternOrVolunteer,
  MONTH_OPTIONS,
  VACANCY_APPLICATION_METHOD_LABELS,
  VACANCY_APPLICATION_METHOD_VALUES,
  VACANCY_PAYMENT_MODE_VALUES,
  VACANCY_TYPE_LABELS,
  VACANCY_TYPE_VALUES,
  type VacancyApplicationMethodValue,
} from '@/lib/vacancies/vacancyConfig'

export type { VacancyFormInitialData, VacancyFormSubmitPayload }

type VacancyFormProps = {
  initialData?: VacancyFormInitialData | null
  onSubmit: (payload: VacancyFormSubmitPayload) => Promise<void>
  isEditMode: boolean
}

export default function VacancyForm({ initialData, onSubmit, isEditMode }: VacancyFormProps) {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { showError } = useGlobalFeedback()
  const [loading, setLoading] = useState(false)
  const [requirementInput, setRequirementInput] = useState('')
  const [responsibilityInput, setResponsibilityInput] = useState('')
  const [benefitInput, setBenefitInput] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  const {
    formState: formData,
    setFormState: setFormData,
    handleInputChange,
  } = useFormState<VacancyFormData>(INITIAL_VACANCY_FORM_DATA)

  const yearOptions = useMemo(() => getYearOptions(10), [])

  useEffect(() => {
    if (!isEditMode || !initialData) {
      setFormData(INITIAL_VACANCY_FORM_DATA)
      return
    }

    const method: VacancyApplicationMethodValue = initialData.applicationMethod || 'link'
    const isPaid = initialData.isPaid ?? false
    const paymentMode = initialData.paymentMode || 'fixed'

    setFormData({
      ...INITIAL_VACANCY_FORM_DATA,
      title: initialData.title || '',
      description: initialData.description || '',
      city: initialData.city || '',
      address: initialData.address || '',
      type: VACANCY_TYPE_VALUES.includes((initialData.type || 'full_time') as any)
        ? (initialData.type as any)
        : 'full_time',
      isPaid,
      paymentMode,
      paymentAmount: initialData.paymentAmount ? String(initialData.paymentAmount) : '',
      paymentMin: initialData.paymentMin ? String(initialData.paymentMin) : '',
      paymentMax: initialData.paymentMax ? String(initialData.paymentMax) : '',
      ageMin: initialData.ageMin !== undefined ? String(initialData.ageMin) : '18',
      ageMax: initialData.ageMax !== undefined ? String(initialData.ageMax) : '65',
      requirements: Array.isArray(initialData.requirements) ? initialData.requirements : [],
      responsibilities: Array.isArray(initialData.responsibilities) ? initialData.responsibilities : [],
      benefits: Array.isArray(initialData.benefits) ? initialData.benefits : [],
      applicationMethod: method,
      applicationValue: initialData.applicationValue || '',
      applicationDeadline: initialData.applicationDeadline
        ? new Date(initialData.applicationDeadline).toISOString().slice(0, 10)
        : '',
      periodFromMonth: initialData.periodFromMonth ? String(initialData.periodFromMonth) : '',
      periodFromYear: initialData.periodFromYear ? String(initialData.periodFromYear) : '',
      periodToMonth: initialData.periodToMonth ? String(initialData.periodToMonth) : '',
      periodToYear: initialData.periodToYear ? String(initialData.periodToYear) : '',
      imageUrl: initialData.imageUrl || '',
    })
  }, [isEditMode, initialData, setFormData])

  const addListItem = (field: 'requirements' | 'responsibilities' | 'benefits', value: string, clear: () => void) => {
    const normalized = value.trim()
    if (!normalized) return
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], normalized] }))
    clear()
  }

  const removeListItem = (field: 'requirements' | 'responsibilities' | 'benefits', index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const onImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const data = new FormData()
      data.append('file', file)
      data.append('context', 'vacancy')
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || 'Sekil yuklenmedi')
      }

      const url = payload?.data?.url || payload?.url
      if (!url) {
        throw new Error('Upload URL tapilmadi')
      }

      setFormData((prev) => ({ ...prev, imageUrl: url }))
    } catch (error: any) {
      showError(error?.message || 'Cover image yuklenmedi')
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateVacancyForm(formData)
    if (validationError) {
      showError(validationError)
      return
    }

    setLoading(true)
    try {
      const payload = buildVacancySubmitPayload(formData)
      await onSubmit(payload)
    } catch (error: any) {
      showError(error?.message || (isEditMode ? 'Vakansiya yenilenmedi' : 'Vakansiya yaradilamadi'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-gray-900">{isEditMode ? 'Vakansiyani redakte et' : 'Yeni vakansiya yarat'}</h1>
          <p className="mt-2 text-sm text-gray-600">Vezife melumatlarini doldurun ve muraciet axinini qurasdirin.</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Vezife basligi" name="title" value={formData.title} onChange={handleInputChange} required />
            <Select
              label="Vakansiya novu"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              options={VACANCY_TYPE_VALUES.map((type) => ({ value: type, label: VACANCY_TYPE_LABELS[type] }))}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Esas seher" name="city" value={formData.city} onChange={handleInputChange} required />
            <Input
              label="Unvan (opsional)"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Kuche, mekan adi ve s."
            />
          </div>
          <TextArea label="Description" name="description" value={formData.description} onChange={handleInputChange} required rows={5} />
        </div>

        {isInternOrVolunteer(formData.type) && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Calendar className="h-5 w-5" /> Program araligi</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select
                label="From ay"
                name="periodFromMonth"
                value={formData.periodFromMonth}
                onChange={handleInputChange}
                options={MONTH_OPTIONS.map((m) => ({ value: String(m.value), label: m.label }))}
                required
              />
              <Select
                label="From il"
                name="periodFromYear"
                value={formData.periodFromYear}
                onChange={handleInputChange}
                options={yearOptions.map((year) => ({ value: String(year), label: String(year) }))}
                required
              />
              <Select
                label="To ay"
                name="periodToMonth"
                value={formData.periodToMonth}
                onChange={handleInputChange}
                options={MONTH_OPTIONS.map((m) => ({ value: String(m.value), label: m.label }))}
                required
              />
              <Select
                label="To il"
                name="periodToYear"
                value={formData.periodToYear}
                onChange={handleInputChange}
                options={yearOptions.map((year) => ({ value: String(year), label: String(year) }))}
                required
              />
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Briefcase className="h-5 w-5" /> Odenis modeli</h2>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="isPaid" checked={formData.isPaid} onChange={handleInputChange} />
            Odenislidir
          </label>
          {formData.isPaid && (
            <div className="space-y-4">
              <Select
                label="Mode"
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleInputChange}
                options={VACANCY_PAYMENT_MODE_VALUES.map((item) => ({ value: item, label: item === 'fixed' ? 'Fixed' : 'Range' }))}
                required
              />
              {formData.paymentMode === 'fixed' && (
                <Input
                  type="number"
                  min="1"
                  label="Amount (AZN)"
                  name="paymentAmount"
                  value={formData.paymentAmount}
                  onChange={handleInputChange}
                  required
                />
              )}
              {formData.paymentMode === 'range' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input type="number" min="1" label="Min (AZN)" name="paymentMin" value={formData.paymentMin} onChange={handleInputChange} required />
                  <Input type="number" min="1" label="Max (AZN)" name="paymentMax" value={formData.paymentMax} onChange={handleInputChange} required />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input type="number" label="Yas min" name="ageMin" min="0" max="99" value={formData.ageMin} onChange={handleInputChange} required />
            <Input type="number" label="Yas max" name="ageMax" min="0" max="99" value={formData.ageMax} onChange={handleInputChange} required />
          </div>

          <div className="flex gap-2">
            <Input label="Yeni requirement" value={requirementInput} onChange={(e) => setRequirementInput(e.target.value)} />
            <Button type="button" variant="outline" onClick={() => addListItem('requirements', requirementInput, () => setRequirementInput(''))}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.requirements.map((item, idx) => (
              <button key={`${item}-${idx}`} type="button" onClick={() => removeListItem('requirements', idx)} className="rounded-full border border-gray-300 px-3 py-1 text-xs">
                {item} x
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Benefits</h2>
          <div className="flex gap-2">
            <Input label="Yeni benefit" value={benefitInput} onChange={(e) => setBenefitInput(e.target.value)} />
            <Button type="button" variant="outline" onClick={() => addListItem('benefits', benefitInput, () => setBenefitInput(''))}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.benefits.map((item, idx) => (
              <button key={`${item}-${idx}`} type="button" onClick={() => removeListItem('benefits', idx)} className="rounded-full border border-gray-300 px-3 py-1 text-xs">
                {item} x
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Responsibilities</h2>
          <div className="flex gap-2">
            <Input label="Yeni responsibility" value={responsibilityInput} onChange={(e) => setResponsibilityInput(e.target.value)} />
            <Button type="button" variant="outline" onClick={() => addListItem('responsibilities', responsibilityInput, () => setResponsibilityInput(''))}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.responsibilities.map((item, idx) => (
              <button key={`${item}-${idx}`} type="button" onClick={() => removeListItem('responsibilities', idx)} className="rounded-full border border-gray-300 px-3 py-1 text-xs">
                {item} x
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Phone className="h-5 w-5" /> Muraciet metodu</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {VACANCY_APPLICATION_METHOD_VALUES.map((method) => (
              <label key={method} className="rounded-xl border border-gray-200 p-3 cursor-pointer">
                <input
                  type="radio"
                  name="applicationMethod"
                  value={method}
                  checked={formData.applicationMethod === method}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                {VACANCY_APPLICATION_METHOD_LABELS[method]}
              </label>
            ))}
          </div>
          <Input
            label={
              formData.applicationMethod === 'link'
                ? 'Application link'
                : formData.applicationMethod === 'email'
                  ? 'Application email'
                  : 'Elaqe nomresi'
            }
            type={formData.applicationMethod === 'email' ? 'email' : 'text'}
            name="applicationValue"
            value={formData.applicationValue}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Vacancy deadline"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            name="applicationDeadline"
            value={formData.applicationDeadline}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Cover image (optional)</h2>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 cursor-pointer">
              {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span>{uploadingImage ? 'Yuklenir...' : 'Sekil sec'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={onImageFileChange} disabled={uploadingImage} />
            </label>
            {formData.imageUrl && (
              <Button type="button" variant="ghost" onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          {formData.imageUrl && (
            <img src={formData.imageUrl} alt="Vacancy cover" className="h-40 w-full max-w-md rounded-xl object-cover border border-gray-200" />
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.push(localePath('/dashboard/vacancies'))}>
            Legv et
          </Button>
          <Button type="submit" disabled={loading || uploadingImage} loading={loading}>
            {isEditMode ? 'Yenile' : 'Yarat'}
          </Button>
        </div>
      </form>
    </div>
  )
}

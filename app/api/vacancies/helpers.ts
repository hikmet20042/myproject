import { isInternOrVolunteer } from '@/lib/vacancies/vacancyConfig'

type ValidationResult = { valid: true } | { valid: false; error: string }

export const validateVacancyPayload = (payload: any): ValidationResult => {
  if (!payload?.title || typeof payload.title !== 'string') return { valid: false, error: 'başlıq tələb olunur' }
  if (!payload?.description || typeof payload.description !== 'string') return { valid: false, error: 'təsvir tələb olunur' }
  if (!payload?.city || typeof payload.city !== 'string' || payload.city.trim().length === 0) {
    return { valid: false, error: 'şəhər tələb olunur' }
  }

  const normalizedType = String(payload.type || '')
  if (!normalizedType) return { valid: false, error: 'tip tələb olunur' }
  if (!['volunteer', 'full_time', 'part_time', 'intern'].includes(normalizedType)) {
    return { valid: false, error: 'tip volunteer, full_time, part_time və ya intern olmalıdır' }
  }

  if (!payload?.applicationDeadline) return { valid: false, error: 'müraciət son tarixi tələb olunur' }
  const deadline = new Date(payload.applicationDeadline)
  if (Number.isNaN(deadline.getTime()) || deadline.getTime() <= Date.now()) {
    return { valid: false, error: 'müraciət son tarixi etibarlı gələcək tarix olmalıdır' }
  }

  const ageMin = Number(payload?.ageRange?.min)
  const ageMax = Number(payload?.ageRange?.max)
  if (!Number.isInteger(ageMin) || !Number.isInteger(ageMax)) {
    return { valid: false, error: 'ageRange.min və ageRange.max tam ədəd olmalıdır' }
  }
  if (ageMin < 0 || ageMax > 99 || ageMin > ageMax) {
    return { valid: false, error: 'ageRange 0-99 arasında olmalıdır və min <= max olmalıdır' }
  }

  if (isInternOrVolunteer(normalizedType)) {
    const period = payload?.programPeriod || {}
    const fromMonth = Number(period.fromMonth)
    const fromYear = Number(period.fromYear)
    const toMonth = Number(period.toMonth)
    const toYear = Number(period.toYear)
    if (
      !Number.isInteger(fromMonth) || !Number.isInteger(fromYear) ||
      !Number.isInteger(toMonth) || !Number.isInteger(toYear)
    ) {
      return { valid: false, error: 'programPeriod from/to ayı və ili könüllü və təcrübəçi üçün tələb olunur' }
    }
    if (
      fromMonth < 1 || fromMonth > 12 ||
      toMonth < 1 || toMonth > 12 ||
      fromYear < 2000 || toYear < 2000
    ) {
      return { valid: false, error: 'programPeriod dəyərləri yanlışdır' }
    }
    const fromStamp = new Date(fromYear, fromMonth - 1, 1).getTime()
    const toStamp = new Date(toYear, toMonth - 1, 1).getTime()
    if (fromStamp > toStamp) {
      return { valid: false, error: 'programPeriod from, to-dan sonra ola bilməz' }
    }
  }

  const payment = payload?.payment || {}
  if (payment.isPaid) {
    if (!payment.mode || !['fixed', 'range'].includes(payment.mode)) {
      return { valid: false, error: 'payment.mode, isPaid true olduqda fixed və ya range olmalıdır' }
    }
    if (payment.mode === 'fixed') {
      const amount = Number(payment.amount)
      if (!Number.isFinite(amount) || amount <= 0) {
        return { valid: false, error: 'payment.amount fixed rejim üçün müsbət olmalıdır' }
      }
    }
    if (payment.mode === 'range') {
      const min = Number(payment.min)
      const max = Number(payment.max)
      if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0 || min > max) {
        return { valid: false, error: 'payment.min və payment.max, range rejimi üçün min <= max olmaqla etibarlı olmalıdır' }
      }
    }
  }

  const method = payload?.application?.method
  const value = String(payload?.application?.value || '').trim()
  if (!method || !['link', 'email', 'phone'].includes(method)) {
    return { valid: false, error: 'application.method link, email və ya phone olmalıdır' }
  }
  if (!value) return { valid: false, error: 'application.value tələb olunur' }

  if (method === 'link') {
    try {
      const parsed = new URL(value)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, error: 'müraciət linki http və ya https olmalıdır' }
      }
    } catch {
      return { valid: false, error: 'müraciət linki yanlışdır' }
    }
  }

  if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { valid: false, error: 'müraciət e-poçtu yanlışdır' }
  }

  if (method === 'phone' && !/^\+?[0-9\s\-()]{7,20}$/.test(value)) {
    return { valid: false, error: 'müraciət telefonu yanlışdır' }
  }

  return { valid: true }
}

export const buildVacancyDbPayload = (payload: any) => {
  const type = payload.type
  const payment = payload.payment || {}
  const application = payload.application || {}
  const ageRange = payload.ageRange || {}

  const method = application.method
  const value = String(application.value || '').trim()

  return {
    title: payload.title.trim(),
    description: payload.description.trim(),
    type,
    city: payload.city.trim(),
    address: payload.address ? String(payload.address).trim() : null,
    application_deadline: payload.applicationDeadline,
    requirements: Array.isArray(payload.requirements) ? payload.requirements : [],
    responsibilities: Array.isArray(payload.responsibilities) ? payload.responsibilities : [],
    image_url: payload.imageUrl || null,
    age_min: Number(ageRange.min),
    age_max: Number(ageRange.max),
    is_paid: Boolean(payment.isPaid),
    payment_mode: payment.isPaid ? payment.mode : null,
    payment_amount: payment.isPaid && payment.mode === 'fixed' ? Number(payment.amount) : null,
    payment_min: payment.isPaid && payment.mode === 'range' ? Number(payment.min) : null,
    payment_max: payment.isPaid && payment.mode === 'range' ? Number(payment.max) : null,
    benefits: Array.isArray(payload.benefits) ? payload.benefits : [],
    application_method: method,
    application_value: value,
    period_from_month: payload.programPeriod ? Number(payload.programPeriod.fromMonth) : null,
    period_from_year: payload.programPeriod ? Number(payload.programPeriod.fromYear) : null,
    period_to_month: payload.programPeriod ? Number(payload.programPeriod.toMonth) : null,
    period_to_year: payload.programPeriod ? Number(payload.programPeriod.toYear) : null,
  }
}

export const mapVacancyRow = (row: any) => ({
  _id: row.id,
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  type: row.type,
  city: row.city,
  address: row.address,
  requirements: row.requirements || [],
  responsibilities: row.responsibilities || [],
  applicationDeadline: row.application_deadline,
  imageUrl: row.image_url,
  ageMin: row.age_min,
  ageMax: row.age_max,
  benefits: row.benefits || [],
  isPaid: row.is_paid,
  paymentMode: row.payment_mode,
  paymentAmount: row.payment_amount,
  paymentMin: row.payment_min,
  paymentMax: row.payment_max,
  applicationMethod: row.application_method,
  applicationValue: row.application_value,
  periodFromMonth: row.period_from_month,
  periodFromYear: row.period_from_year,
  periodToMonth: row.period_to_month,
  periodToYear: row.period_to_year,
  createdBy: row.created_by
    ? { _id: row.created_by.id, name: row.created_by.name, email: row.created_by.email }
    : row.created_by,
  createdByOrganization: row.created_by_organization
    ? { _id: row.created_by_organization.id, id: row.created_by_organization.id, organizationName: row.created_by_organization.organization_name, email: row.created_by_organization.email, urlHandle: row.created_by_organization.url_handle }
    : row.created_by_organization,
  status: row.status,
  approvedAt: row.approved_at,
  approvedBy: row.approved_by
    ? { _id: row.approved_by.id, name: row.approved_by.name }
    : row.approved_by,
  rejectedAt: row.rejected_at,
  rejectionReason: row.rejection_reason,
  adminComment: row.admin_comment,
  isPublished: row.is_published,
  isFeatured: row.is_featured,
  isUrgent: row.is_urgent,
  views: row.real_views ?? row.views,
  uniqueViews: row.real_unique_views ?? row.unique_views,
  saves: row.real_saves ?? row.saves ?? 0,
  viewedBy: row.viewed_by || [],
  engagementScore: row.engagement_score,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

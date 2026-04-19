import type { VacancyFormData } from '@/features/vacancies/types/form'
import { isInternOrVolunteer } from '@/lib/vacancies/vacancyConfig'

export const validateVacancyForm = (formData: VacancyFormData) => {
  if (!formData.title.trim()) {
    return 'Vezife basligi teleb olunur'
  }

  if (!formData.description.trim()) {
    return 'Description teleb olunur'
  }

  if (!formData.type) {
    return 'Vakansiya novu teleb olunur'
  }

  if (!formData.city.trim()) {
    return 'Seher teleb olunur'
  }

  if (!formData.ageMin || !formData.ageMax) {
    return 'Yas araligi min/max teleb olunur'
  }

  const ageMin = Number(formData.ageMin)
  const ageMax = Number(formData.ageMax)
  if (!Number.isInteger(ageMin) || !Number.isInteger(ageMax)) {
    return 'Yas araligi tam eded olmalidir'
  }

  if (ageMin < 0 || ageMax > 99 || ageMin > ageMax) {
    return 'Yas araligi 0-99 araliginda ve duzgun sirada olmalidir'
  }

  if (isInternOrVolunteer(formData.type)) {
    if (!formData.periodFromMonth || !formData.periodFromYear || !formData.periodToMonth || !formData.periodToYear) {
      return 'Intern/Konullu ucun ay-il araligi teleb olunur'
    }

    const fromMonth = Number(formData.periodFromMonth)
    const toMonth = Number(formData.periodToMonth)
    const fromYear = Number(formData.periodFromYear)
    const toYear = Number(formData.periodToYear)

    if (
      fromMonth < 1 || fromMonth > 12 || toMonth < 1 || toMonth > 12 ||
      fromYear < 2000 || toYear < 2000
    ) {
      return 'Ay/il deyerleri etibarli deyil'
    }

    if (new Date(fromYear, fromMonth - 1, 1).getTime() > new Date(toYear, toMonth - 1, 1).getTime()) {
      return 'Period from, period to tarixinden boyuk ola bilmez'
    }
  }

  if (formData.isPaid) {
    if (!formData.paymentMode) {
      return 'Odenis mode secilmelidir'
    }

    if (formData.paymentMode === 'fixed') {
      const amount = Number(formData.paymentAmount)
      if (!Number.isFinite(amount) || amount <= 0) {
        return 'Fixed odenis ucun amount teleb olunur'
      }
    }

    if (formData.paymentMode === 'range') {
      const min = Number(formData.paymentMin)
      const max = Number(formData.paymentMax)
      if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0 || min > max) {
        return 'Range odenis ucun min/max duzgun daxil edilmelidir'
      }
    }
  }

  if (!formData.applicationDeadline) {
    return 'Müraciət üçün son tarixi seç'
  }

  const deadline = new Date(formData.applicationDeadline)
  if (Number.isNaN(deadline.getTime()) || deadline.getTime() <= Date.now()) {
    return 'Son tarix indiki vaxtdan gelecekde olmalidir'
  }

  if (!formData.applicationValue.trim()) {
    return 'Muraciet deyerini daxil et'
  }

  if (formData.applicationMethod === 'link' && !formData.applicationValue.match(/^https?:\/\//i)) {
    return 'Müraciət linki təmin et'
  }

  if (formData.applicationMethod === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.applicationValue)) {
    return 'Müraciət e-poçtunu təmin et'
  }

  if (formData.applicationMethod === 'phone' && !/^\+?[0-9\s\-()]{7,20}$/.test(formData.applicationValue)) {
    return 'Müraciet nomresi duzgun deyil'
  }

  if (!Array.isArray(formData.requirements) || formData.requirements.filter((item) => item.trim()).length === 0) {
    return 'En azi bir requirement daxil edilmelidir'
  }

  return null
}

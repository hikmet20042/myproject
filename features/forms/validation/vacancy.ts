import type { VacancyFormData } from '@/features/vacancies/types/form'

export const validateVacancyForm = (formData: VacancyFormData) => {
  if (!formData.applicationDeadline) {
    return 'Müraciət üçün son tarixi seç'
  }

  if (!formData.applicationInstructions.trim()) {
    return 'Müraciət təlimatlarını daxil et'
  }

  if (formData.applicationMethod === 'link' && !formData.applicationLink) {
    return 'Müraciət linki təmin et'
  }

  if (formData.applicationMethod === 'email' && !formData.applicationEmail) {
    return 'Müraciət e-poçtunu təmin et'
  }

  return null
}

import { createPayloadBuilder } from '@/features/forms/payloadBuilder'
import type {
  VacancyFormData,
  VacancyFormSubmitPayload,
} from '@/features/vacancies/types/form'

export const buildVacancySubmitPayload = createPayloadBuilder<
  VacancyFormData,
  VacancyFormSubmitPayload
>((formData) => ({
  title: formData.title.trim(),
  description: formData.description.trim(),
  type: formData.type,
  city: formData.city.trim(),
  address: formData.address.trim() || undefined,
  programPeriod:
    formData.type === 'intern' || formData.type === 'volunteer'
      ? {
          fromMonth: parseInt(formData.periodFromMonth, 10),
          fromYear: parseInt(formData.periodFromYear, 10),
          toMonth: parseInt(formData.periodToMonth, 10),
          toYear: parseInt(formData.periodToYear, 10),
        }
      : undefined,
  payment: {
    isPaid: formData.isPaid,
    mode: formData.isPaid ? formData.paymentMode : undefined,
    amount: formData.isPaid && formData.paymentMode === 'fixed'
      ? parseFloat(formData.paymentAmount)
      : undefined,
    min: formData.isPaid && formData.paymentMode === 'range'
      ? parseFloat(formData.paymentMin)
      : undefined,
    max: formData.isPaid && formData.paymentMode === 'range'
      ? parseFloat(formData.paymentMax)
      : undefined,
    currency: 'AZN',
  },
  ageRange: {
    min: parseInt(formData.ageMin, 10),
    max: parseInt(formData.ageMax, 10),
  },
  application: {
    method: formData.applicationMethod,
    value: formData.applicationValue.trim(),
  },
  applicationDeadline: new Date(formData.applicationDeadline).toISOString(),
  requirements: formData.requirements.filter((req) => req.trim() !== ''),
  responsibilities: formData.responsibilities.filter((item) => item.trim() !== ''),
  benefits: formData.benefits.filter((item) => item.trim() !== ''),
  imageUrl: formData.imageUrl || undefined,
}))

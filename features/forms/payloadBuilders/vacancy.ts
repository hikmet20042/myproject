import { createPayloadBuilder } from '@/features/forms/payloadBuilder'
import type {
  VacancyFormData,
  VacancyFormSubmitPayload,
} from '@/features/vacancies/components/vacancyForm.types'

export const buildVacancySubmitPayload = createPayloadBuilder<
  VacancyFormData,
  VacancyFormSubmitPayload
>((formData) => ({
  title: formData.title,
  description: formData.description,
  type: formData.type,
  category: formData.category,
  workType: formData.workType,
  location: {
    city: formData.city || undefined,
    country: formData.country || undefined,
    isRemote: formData.workType === 'remote',
  },
  duration: {
    type: formData.durationType || 'permanent',
    ...(formData.contractLength && {
      contractLength: {
        value: parseInt(formData.contractLength),
        unit: formData.contractUnit,
      },
    }),
  },
  compensation: {
    type: formData.compensationType || 'unpaid',
    ...(formData.compensationAmount && {
      amount: parseFloat(formData.compensationAmount),
      currency: 'USD',
      period: 'monthly',
    }),
    benefits: formData.benefits.filter((benefit) => benefit.trim() !== ''),
  },
  applicationProcess: {
    ...(formData.applicationMethod === 'link' &&
      formData.applicationLink && { applicationLink: formData.applicationLink }),
    ...(formData.applicationMethod === 'email' &&
      formData.applicationEmail && { email: formData.applicationEmail }),
    instructions:
      formData.applicationInstructions ||
      'Zəhmət olmasa göstərilən müraciət üsulundan istifadə edin.',
    requiredDocuments: ['CV/Resume'],
  },
  applicationDeadline: new Date(formData.applicationDeadline),
  experienceLevel: formData.experienceLevel || 'any',
  requirements: formData.requirements.filter((req) => req.trim() !== ''),
  responsibilities: formData.responsibilities.filter((resp) => resp.trim() !== ''),
  qualifications: formData.qualifications.filter((qual) => qual.trim() !== ''),
  skills: formData.tags.filter((tag) => tag.trim() !== ''),
  tags: formData.tags.filter((tag) => tag.trim() !== ''),
}))

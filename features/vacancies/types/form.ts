import type {
  VacancyApplicationMethodValue,
  VacancyPaymentModeValue,
  VacancyTypeValue,
} from '@/lib/vacancies/vacancyConfig'

export type VacancyFormData = {
  title: string
  type: VacancyTypeValue
  description: string
  city: string
  address: string
  isPaid: boolean
  paymentMode: VacancyPaymentModeValue
  paymentAmount: string
  paymentMin: string
  paymentMax: string
  ageMin: string
  ageMax: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  applicationMethod: VacancyApplicationMethodValue
  applicationValue: string
  applicationDeadline: string
  periodFromMonth: string
  periodFromYear: string
  periodToMonth: string
  periodToYear: string
  imageUrl: string
}

export type VacancyFormSubmitPayload = {
  title: string
  description: string
  type: VacancyTypeValue
  city: string
  address?: string
  programPeriod?: {
    fromMonth: number
    fromYear: number
    toMonth: number
    toYear: number
  }
  payment: {
    isPaid: boolean
    mode?: VacancyPaymentModeValue
    amount?: number
    min?: number
    max?: number
    currency: 'AZN'
  }
  ageRange: {
    min: number
    max: number
  }
  application: {
    method: VacancyApplicationMethodValue
    value: string
  }
  applicationDeadline: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  imageUrl?: string
}

export type VacancyFormInitialData = {
  title?: string
  type?: VacancyTypeValue
  description?: string
  city?: string
  address?: string
  applicationMethod?: VacancyApplicationMethodValue
  applicationValue?: string
  applicationDeadline?: string
  requirements?: string[]
  responsibilities?: string[]
  benefits?: string[]
  isPaid?: boolean
  paymentMode?: VacancyPaymentModeValue
  paymentAmount?: number
  paymentMin?: number
  paymentMax?: number
  ageMin?: number
  ageMax?: number
  periodFromMonth?: number
  periodFromYear?: number
  periodToMonth?: number
  periodToYear?: number
  imageUrl?: string
}

export type VacancyArrayField =
  | 'requirements'
  | 'responsibilities'
  | 'benefits'

export const INITIAL_VACANCY_FORM_DATA: VacancyFormData = {
  title: '',
  type: 'full_time',
  description: '',
  city: '',
  address: '',
  isPaid: false,
  paymentMode: 'fixed',
  paymentAmount: '',
  paymentMin: '',
  paymentMax: '',
  ageMin: '',
  ageMax: '',
  requirements: [],
  responsibilities: [],
  benefits: [],
  applicationMethod: 'link',
  applicationValue: '',
  applicationDeadline: '',
  periodFromMonth: '',
  periodFromYear: '',
  periodToMonth: '',
  periodToYear: '',
  imageUrl: '',
}

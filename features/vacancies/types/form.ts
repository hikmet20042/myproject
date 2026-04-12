export type VacancyFormData = {
  title: string
  type: 'job' | 'volunteer' | 'internship'
  description: string
  category: string
  workType: 'remote' | 'onsite' | 'hybrid'
  city: string
  country: string
  applicationMethod: 'link' | 'email'
  applicationLink: string
  applicationEmail: string
  applicationInstructions: string
  applicationDeadline: string
  requirements: string[]
  responsibilities: string[]
  qualifications: string[]
  benefits: string[]
  tags: string[]
  experienceLevel: string
  compensationType: string
  compensationAmount: string
  durationType: string
  contractLength: string
  contractUnit: string
}

export type VacancyFormSubmitPayload = {
  title: string
  description: string
  type: 'job' | 'volunteer' | 'internship'
  category: string
  workType: 'remote' | 'onsite' | 'hybrid'
  location: {
    city?: string
    country?: string
    isRemote: boolean
  }
  duration: {
    type: string
    contractLength?: {
      value: number
      unit: string
    }
  }
  compensation: {
    type: string
    amount?: number
    currency?: string
    period?: string
    benefits: string[]
  }
  applicationProcess: {
    applicationLink?: string
    email?: string
    instructions: string
    requiredDocuments: string[]
  }
  applicationDeadline: Date
  experienceLevel: string
  requirements: string[]
  responsibilities: string[]
  qualifications: string[]
  skills: string[]
  tags: string[]
}

export type VacancyFormInitialData = {
  title?: string
  type?: 'job' | 'volunteer' | 'internship'
  description?: string
  category?: string
  workType?: 'remote' | 'onsite' | 'hybrid'
  location?: {
    city?: string
    country?: string
    isRemote?: boolean
  }
  applicationProcess?: {
    applicationLink?: string
    email?: string
    instructions?: string
  }
  applicationDeadline?: string
  requirements?: string[]
  responsibilities?: string[]
  qualifications?: string[]
  tags?: string[]
  experienceLevel?: string
  compensation?: {
    type?: string
    amount?: number
    benefits?: string[]
  }
  duration?: {
    type?: string
    contractLength?: {
      value?: number
      unit?: string
    }
  }
}

export type VacancyArrayField =
  | 'requirements'
  | 'responsibilities'
  | 'qualifications'
  | 'benefits'
  | 'tags'

export const INITIAL_VACANCY_FORM_DATA: VacancyFormData = {
  title: '',
  type: 'job',
  description: '',
  category: '',
  workType: 'onsite',
  city: '',
  country: '',
  applicationMethod: 'link',
  applicationLink: '',
  applicationEmail: '',
  applicationInstructions: '',
  applicationDeadline: '',
  requirements: [''],
  responsibilities: [''],
  qualifications: [''],
  benefits: [''],
  tags: [''],
  experienceLevel: '',
  compensationType: '',
  compensationAmount: '',
  durationType: '',
  contractLength: '',
  contractUnit: 'months',
}

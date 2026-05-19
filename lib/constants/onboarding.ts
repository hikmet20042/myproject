export const ALLOWED_INTERESTS = ['IT', 'Təhsil', 'Könüllülük', 'Sosial fəaliyyət', 'Digər'] as const
export type AllowedInterest = (typeof ALLOWED_INTERESTS)[number]

export const ONBOARDING_STEPS = {
  ROLE: 1,
  DETAILS: 2,
  COMPLETE: 3,
} as const

export const TOTAL_ONBOARDING_STEPS = 3

export const MIN_DESCRIPTION_LENGTH = 20
export const MAX_INTERESTS = 5
export const MIN_INTERESTS = 1

export type UserOnboardingRequest = {
  interests: string[]
  name?: string
}

export type OrganizationOnboardingRequest = {
  organizationName: string
  organizationType: string
  description: string
}

export type OnboardingSuccessResponse = {
  message: string
  redirect?: string
}

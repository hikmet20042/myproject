import { ORGANIZATION_TYPE_VALUES } from '@/lib/organizationTypes'
import { ORGANIZATION_TYPE_LABELS } from '@/lib/organizationTypes'
import { normalizeFocusAreas } from '@/lib/organizationTypes'

type OrganizationStatus = 'pending' | 'approved' | 'rejected'

export type OrganizationResponse = {
  id: string
  organizationName: string
  profileImage: string
  organizationType: string
  organizationTypeLabel: string
  description: string
  website: string
  contactPhone: string
  address: string
  registrationNumber: string
  contactPerson: {
    name: string
    email: string
    phone: string
    position: string
  }
  focusAreas: string[]
  socialMedia: Record<string, string>
  status: OrganizationStatus
  isVerified: boolean
  followerCount: number
  createdAt: string | null
  updatedAt: string | null
}

const SOCIAL_MEDIA_KEYS = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'website', 'tiktok'] as const
const MIN_ORGANIZATION_NAME_LENGTH = 3
const MIN_DESCRIPTION_LENGTH = 20

const toTrimmedString = (value: unknown): string => {
  if (typeof value !== 'string') return ''
  return value.trim()
}

const normalizeProfileImage = (value: unknown): string => {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'object' && !Array.isArray(value)) {
    const maybeUrl = toTrimmedString((value as Record<string, unknown>).url)
    return maybeUrl
  }
  return ''
}

const isValidHttpUrl = (value: string): boolean => {
  if (!value) return true
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const toStatus = (value: unknown): OrganizationStatus => {
  if (value === 'approved' || value === 'rejected' || value === 'pending') {
    return value
  }
  return 'pending'
}

export const sanitizeSocialMedia = (input: unknown): Record<string, string> => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {}
  }

  const source = input as Record<string, unknown>
  const output: Record<string, string> = {}

  for (const key of SOCIAL_MEDIA_KEYS) {
    const value = toTrimmedString(source[key])
    if (value && isValidHttpUrl(value)) {
      output[key] = value
    }
  }

  return output
}

export const normalizeOrganizationProfile = (row: Record<string, any>): OrganizationResponse => {
  const organizationType = toTrimmedString(row.organization_type ?? row.organizationType)
  const normalizedType = ORGANIZATION_TYPE_VALUES.includes(organizationType as (typeof ORGANIZATION_TYPE_VALUES)[number])
    ? (organizationType as (typeof ORGANIZATION_TYPE_VALUES)[number])
    : 'other'

  return {
    id: String(row.account_id || row.id || ''),
    organizationName: toTrimmedString(row.organization_name ?? row.organizationName),
    profileImage: normalizeProfileImage(row.profile_image ?? row.profileImage),
    organizationType,
    organizationTypeLabel: ORGANIZATION_TYPE_LABELS[normalizedType],
    description: toTrimmedString(row.description),
    website: toTrimmedString(row.website),
    contactPhone: toTrimmedString(row.contact_phone ?? row.contactPhone),
    address: toTrimmedString(row.address),
    registrationNumber: toTrimmedString(row.registration_number ?? row.registrationNumber),
    contactPerson: {
      name: toTrimmedString(row.contact_person?.name ?? row.contactPerson?.name),
      email: toTrimmedString(row.contact_person?.email ?? row.contactPerson?.email),
      phone: toTrimmedString(row.contact_person?.phone ?? row.contactPerson?.phone),
      position: toTrimmedString(row.contact_person?.position ?? row.contactPerson?.position),
    },
    focusAreas: normalizeFocusAreas(
      Array.isArray(row.focus_areas) ? row.focus_areas : row.focusAreas
    ),
    socialMedia: sanitizeSocialMedia(row.social_links ?? row.socialMedia),
    status: toStatus(row.moderation_status ?? row.status),
    isVerified:
      row.is_verified === true ||
      row.isVerified === true ||
      row.moderation_status === 'approved' ||
      row.status === 'approved',
    followerCount: Number(row.follower_count ?? row.followerCount ?? 0) || 0,
    createdAt: row.created_at || row.createdAt || null,
    updatedAt: row.updated_at || row.updatedAt || null,
  }
}

type ValidatedOrganizationUpdate = {
  organizationName: string
  organizationType?: string
  description: string
  website: string
  contactPhone: string
  address: string
  registrationNumber: string
  contactPerson: {
    name: string
    email: string
    phone: string
    position: string
  }
  focusAreas: string[]
  socialMedia: Record<string, string>
}

export const validateOrganizationUpdatePayload = (
  payload: unknown
): { data?: ValidatedOrganizationUpdate; error?: string } => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { error: 'Invalid payload' }
  }

  const source = payload as Record<string, unknown>
  const organizationName = toTrimmedString(source.organizationName)
  const description = toTrimmedString(source.description)
  const organizationTypeValue = toTrimmedString(source.organizationType)
  const website = toTrimmedString(source.website)
  const contactPhone = toTrimmedString(source.contactPhone)
  const address = toTrimmedString(source.address)
  const registrationNumber = toTrimmedString(source.registrationNumber)
  const contactPersonRaw =
    source.contactPerson && typeof source.contactPerson === 'object'
      ? (source.contactPerson as Record<string, unknown>)
      : {}
  const contactPerson = {
    name: toTrimmedString(contactPersonRaw.name),
    email: toTrimmedString(contactPersonRaw.email),
    phone: toTrimmedString(contactPersonRaw.phone),
    position: toTrimmedString(contactPersonRaw.position),
  }

  if (!organizationName || !description) {
    return { error: 'Organization name and description are required' }
  }

  if (organizationName.length < MIN_ORGANIZATION_NAME_LENGTH) {
    return { error: `Organization name must be at least ${MIN_ORGANIZATION_NAME_LENGTH} characters` }
  }

  if (description.length < MIN_DESCRIPTION_LENGTH) {
    return { error: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters` }
  }

  if (organizationTypeValue && !ORGANIZATION_TYPE_VALUES.includes(organizationTypeValue as (typeof ORGANIZATION_TYPE_VALUES)[number])) {
    return { error: 'Invalid organization type' }
  }

  if (website && !isValidHttpUrl(website)) {
    return { error: 'Website must be a valid URL' }
  }

  const focusAreas = normalizeFocusAreas(source.focusAreas)

  return {
    data: {
      organizationName,
      organizationType: organizationTypeValue || undefined,
      description,
      website,
      contactPhone,
      address,
      registrationNumber,
      contactPerson,
      focusAreas,
      socialMedia: sanitizeSocialMedia(source.socialMedia),
    },
  }
}

// ---------------------------------------------------------------------------
// Organization fixtures
// ---------------------------------------------------------------------------

export type OrgModerationStatus = 'pending' | 'approved' | 'rejected'

export interface OrgFixture {
  id: string
  name: string
  slug: string
  account_id: string
  moderation_status: OrgModerationStatus
  description?: string
  logo_url?: string
  website?: string
  createdAt: string
}

export function makeOrg(overrides: Partial<OrgFixture> & { moderation_status?: OrgModerationStatus } = {}): OrgFixture {
  const id = overrides.id ?? 'org-1'
  return {
    id,
    name: overrides.name ?? 'Test Organization',
    slug: overrides.slug ?? `test-org-${id}`,
    account_id: overrides.account_id ?? 'test-organization-id',
    moderation_status: overrides.moderation_status ?? 'approved',
    description: overrides.description ?? 'A test organization.',
    createdAt: overrides.createdAt ?? new Date().toISOString(),
  }
}

export const ORG_FIXTURES = {
  approved: makeOrg({ moderation_status: 'approved' }),
  pending: makeOrg({ moderation_status: 'pending' }),
  rejected: makeOrg({ moderation_status: 'rejected' }),
}

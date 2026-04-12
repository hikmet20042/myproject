export type Role = 'admin' | 'user' | 'moderator' | 'editor' | string
export type AccountType = 'user' | 'organization' | null | string
export type OrganizationStatus = 'pending' | 'approved' | 'rejected' | null | string

export type SessionUser = {
  id?: string
  role?: Role
  accountType?: AccountType
  organizationStatus?: OrganizationStatus
  isActive?: boolean
}

export type Session = {
  user?: SessionUser
} | null | undefined

export type ResourceOwner = {
  id?: string | number | null
  userId?: string | number | null
  authorId?: string | number | null
  accountId?: string | number | null
  owner_id?: string | number | null
  user_id?: string | number | null
  author_id?: string | number | null
  account_id?: string | number | null
  created_by?: string | number | null
  created_by_organization?: string | number | null
}

const toId = (value?: string | number | null) => (value === undefined || value === null ? null : String(value))
const PERMISSIONS_DEBUG = process.env.DEBUG_PERMISSIONS_LOGS === 'true'

const logPermissionFailure = (reason: string, session: Session) => {
  if (!PERMISSIONS_DEBUG) return
  console.warn('[permissions] denied', {
    reason,
    userId: session?.user?.id ?? null,
    role: session?.user?.role ?? null,
    accountType: session?.user?.accountType ?? null,
    organizationStatus: session?.user?.organizationStatus ?? null,
  })
}

/**
 * Role Checks
 * Use these when you need to reason about role membership only.
 */
export function isAdmin(session: Session): boolean {
  return session?.user?.role === 'admin'
}

/**
 * Account Type Checks
 * Use these to determine account type or organization approval state.
 */
export function isOrganization(session: Session): boolean {
  return session?.user?.accountType === 'organization'
}

export function isApprovedOrganization(session: Session): boolean {
  return isOrganization(session) && session?.user?.organizationStatus === 'approved'
}

/**
 * Account Status Checks
 * Use these to validate account activation status from session.
 */
export function isActive(session: Session): boolean {
  return session?.user?.isActive === true
}

/**
 * Access Checks
 * Use these for route-level access control (UI and API).
 */
export function canAccessDashboard(session: Session): boolean {
  const allowed = isApprovedOrganization(session)
  if (!allowed) logPermissionFailure('dashboard', session)
  return allowed
}

export function canAccessAdmin(session: Session): boolean {
  const allowed = isAdmin(session)
  if (!allowed) logPermissionFailure('admin', session)
  return allowed
}

/**
 * Action Permissions
 * Use these for feature actions like creating resources.
 */
export function canCreateEvent(session: Session): boolean {
  const allowed = isApprovedOrganization(session)
  if (!allowed) logPermissionFailure('create:event', session)
  return allowed
}

export function canCreateVacancy(session: Session): boolean {
  const allowed = isApprovedOrganization(session)
  if (!allowed) logPermissionFailure('create:vacancy', session)
  return allowed
}

/**
 * Ownership Helpers
 * Use these to enforce resource ownership rules in API routes.
 */
export function isOwner(session: Session, resource: ResourceOwner): boolean {
  const userId = toId(session?.user?.id)
  if (!userId) return false
  const candidates = [
    resource.id,
    resource.userId,
    resource.authorId,
    resource.accountId,
    resource.owner_id,
    resource.user_id,
    resource.author_id,
    resource.account_id,
    resource.created_by,
    resource.created_by_organization,
  ].map(toId)
  return candidates.some((value) => value === userId)
}

export function isAdminOrOwner(session: Session, resource: ResourceOwner): boolean {
  return isAdmin(session) || isOwner(session, resource)
}

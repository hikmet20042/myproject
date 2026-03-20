export const Roles = {
  ADMIN: 'admin',
  ORGANIZATION: 'organization',
  USER: 'user',
} as const

export type Role = typeof Roles[keyof typeof Roles]

export const isAdmin = (role?: string | null) => role === Roles.ADMIN
export const isOrganization = (role?: string | null) => role === Roles.ORGANIZATION
export const isUser = (role?: string | null) => role === Roles.USER

/** Check if session user is admin based on canonical role. */
export function isAdminSession(session: { user?: { role?: string } } | null): boolean {
  if (!session?.user) return false
  return session.user.role === Roles.ADMIN
}

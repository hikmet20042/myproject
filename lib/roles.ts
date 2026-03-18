export const Roles = {
  ADMIN: 'admin',
  ORGANIZATION: 'organization',
  USER: 'user',
} as const

export type Role = typeof Roles[keyof typeof Roles]

export const isAdmin = (role?: string | null) => role === Roles.ADMIN
export const isOrganization = (role?: string | null) => role === Roles.ORGANIZATION
export const isUser = (role?: string | null) => role === Roles.USER

/** Check if session user is admin (role or ADMIN_EMAILS env). Use this for route guards. */
export function isAdminSession(session: { user?: { role?: string; email?: string | null } } | null): boolean {
  if (!session?.user) return false
  if (session.user.role === Roles.ADMIN) return true
  const adminEmails = (typeof process !== 'undefined' && process.env.ADMIN_EMAILS)
    ? process.env.ADMIN_EMAILS.split(',').map((e: string) => e.trim().toLowerCase())
    : []
  return !!session.user.email && adminEmails.includes(session.user.email.toLowerCase())
}

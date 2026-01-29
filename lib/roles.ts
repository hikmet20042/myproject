export const Roles = {
  ADMIN: 'admin',
  NGO: 'ngo',
  USER: 'user',
} as const

export type Role = typeof Roles[keyof typeof Roles]

export const isAdmin = (role?: string | null) => role === Roles.ADMIN
export const isNGO = (role?: string | null) => role === Roles.NGO
export const isUser = (role?: string | null) => role === Roles.USER

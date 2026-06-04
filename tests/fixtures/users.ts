export const users = {
  admin: {
    email: 'admin@icma360.org',
    password: 'AdminPass123!',
    accountType: 'admin' as const,
  },
  organization: {
    email: 'org@icma360.org',
    password: 'OrgPass123!',
    accountType: 'organization' as const,
  },
  user: {
    email: 'user@icma360.org',
    password: 'UserPass123!',
    accountType: 'user' as const,
  },
}

export type TestUserRole = keyof typeof users

import { createSupabaseServerClient } from '@/lib/supabase/server'

export type AppSessionUser = {
  id: string
  email: string | null
  name?: string | null
  role: 'user' | 'admin'
  emailVerified?: boolean
  accountType: 'user' | 'organization'
  organizationStatus: 'pending' | 'approved' | 'rejected' | null
  isActive?: boolean
}

export type AppSession = {
  user: AppSessionUser
}

export async function getServerSession() {
  const supabase = createSupabaseServerClient()
  const { data: authData, error } = await supabase.auth.getUser()

  if (error || !authData?.user) {
    return null
  }

  const user = authData.user
  const { data: account } = await supabase
    .from('accounts')
    .select('account_type, is_admin, is_active')
    .eq('id', user.id)
    .maybeSingle()

  const accountType = account?.account_type as 'user' | 'organization' | undefined
  const role: 'admin' | 'user' = account?.is_admin ? 'admin' : 'user'

  if (accountType === 'organization') {
    const { data: organizationProfile } = await supabase
      .from('organization_profiles')
      .select('account_id, organization_name, moderation_status')
      .eq('account_id', user.id)
      .maybeSingle()

    if (!organizationProfile) {
      console.warn(`Missing organization_profiles row for account_id=${user.id}`)
    }

    const organizationName = organizationProfile?.organization_name
      ?? user.user_metadata?.name
      ?? null

    const moderationStatus = organizationProfile?.moderation_status
    const normalizedOrganizationStatus: 'pending' | 'approved' | 'rejected' | null =
      moderationStatus === 'pending' || moderationStatus === 'approved' || moderationStatus === 'rejected'
        ? moderationStatus
        : null

    if (process.env.NODE_ENV === 'development') {
      console.debug('[auth][server] authority', {
        id: user.id,
        role,
        accountType,
        organizationStatus: normalizedOrganizationStatus,
      })
    }

    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        name: organizationName,
        role,
        emailVerified: !!user.email_confirmed_at,
        accountType: 'organization',
        organizationStatus: normalizedOrganizationStatus,
        isActive: account?.is_active ?? true,
      },
    } satisfies AppSession
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', user.id)
    .maybeSingle()

  if (process.env.NODE_ENV === 'development') {
    console.debug('[auth][server] authority', {
      id: user.id,
      role,
      accountType,
      organizationStatus: null,
    })
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      name: profile?.name ?? user.user_metadata?.name ?? null,
      role,
      emailVerified: !!user.email_confirmed_at,
      accountType: accountType === 'organization' ? 'organization' : 'user',
      organizationStatus: null,
      isActive: account?.is_active ?? true,
    },
  } satisfies AppSession
}

export async function requireServerSession() {
  const session = await getServerSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireAdminSession() {
  const session = await requireServerSession()
  if (session.user.role !== 'admin') {
    throw new Error('Forbidden')
  }
  return session
}

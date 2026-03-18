import { createSupabaseServerClient } from '@/lib/supabase/server'

export type AppSessionUser = {
  id: string
  email: string | null
  name?: string | null
  role?: 'user' | 'admin'
  emailVerified?: boolean
  isApprovedOrganization?: boolean
  accountType: 'user' | 'organization'
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

  const accountType = (account?.account_type as 'user' | 'organization' | undefined)
    || (user.app_metadata?.account_type as 'user' | 'organization')
    || 'user'

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
      ?? 'pending'

    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        name: organizationName,
        role: undefined,
        emailVerified: !!user.email_confirmed_at,
        isApprovedOrganization: moderationStatus === 'approved',
        accountType: 'organization',
        isActive: account?.is_active ?? true,
      },
    } satisfies AppSession
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, role')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin = (account?.is_admin ?? false) || profile?.role === 'admin'

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      name: profile?.name ?? user.user_metadata?.name ?? null,
      role: isAdmin ? 'admin' : 'user',
      emailVerified: !!user.email_confirmed_at,
      isApprovedOrganization: false,
      accountType: 'user',
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

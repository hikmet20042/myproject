import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/'

  const supabase = createSupabaseServerClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent('OAuthSignin')}`, url.origin))
    }

    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      const provider = data.user.app_metadata?.provider

      if (provider !== 'google') {
        return NextResponse.redirect(new URL(next, url.origin))
      }

      const adminSupabase = createSupabaseAdminClient()

      const { data: existingAccount } = await adminSupabase
        .from('accounts')
        .select('account_type, is_admin')
        .eq('id', data.user.id)
        .maybeSingle()

      if (!existingAccount) {
        await adminSupabase
          .from('accounts')
          .upsert({
            id: data.user.id,
            account_type: 'user',
            is_admin: false,
            is_active: true,
          }, { onConflict: 'id' })
      }

      const { data: account } = await adminSupabase
        .from('accounts')
        .select('account_type, is_admin')
        .eq('id', data.user.id)
        .maybeSingle()

      const accountType = account?.account_type as 'user' | 'organization' | undefined
      const role = account?.is_admin ? 'admin' : 'user'

      await adminSupabase
        .from('users')
        .upsert({
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.email,
          email: data.user.email,
          role,
          auth_provider: 'google'
        }, { onConflict: 'id' })
    }
  }

  return NextResponse.redirect(new URL(next, url.origin))
}

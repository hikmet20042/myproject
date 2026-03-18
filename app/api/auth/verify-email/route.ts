import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token') || url.searchParams.get('token_hash');
    const type = url.searchParams.get('type') || 'signup';
    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }
    const supabase = createSupabaseServerClient()

    const { data: verified, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change'
    })

    if (error || !verified?.user) {
      return NextResponse.json(
        { error: error?.message || 'Invalid verification token' },
        { status: 400 }
      )
    }

    const adminSupabase = createSupabaseAdminClient()
    const { data: account } = await adminSupabase
      .from('accounts')
      .select('account_type')
      .eq('id', verified.user.id)
      .maybeSingle()

    const accountType = (account?.account_type as 'user' | 'organization' | undefined)
      || (verified.user.app_metadata?.account_type as 'user' | 'organization')
      || 'user'
    const isOrganization = accountType === 'organization'

    if (!isOrganization) {
      await supabase.from('notifications').insert({
        user_id: verified.user.id,
        type: 'email_verification',
        title: 'E-poçt uğurla təsdiqləndi!',
        message: 'E-poçtunuz təsdiqləndi. İndi hesabınıza daxil ola bilərsiniz.',
        data: { type: 'email_verification' },
      })
    }

    const message = isOrganization
      ? 'E-poçt uğurla təsdiqləndi! Təşkilat qeydiyyatınız indi admin təsdiqi gözləyir.'
      : 'E-poçt uğurla təsdiqləndi! İndi daxil ola bilərsiniz.';
      
    return NextResponse.json({
      message,
      accountType: isOrganization ? 'organization' : 'user'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const adminSupabase = createSupabaseAdminClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (authData.user.email_confirmed_at) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    const { data: account } = await adminSupabase
      .from('accounts')
      .select('account_type')
      .eq('id', authData.user.id)
      .maybeSingle()

    const accountType = (account?.account_type as 'user' | 'organization' | undefined)
      || (authData.user.app_metadata?.account_type as 'user' | 'organization')
      || 'user'
    let accountRow: any = null

    if (accountType === 'organization') {
      const { data: profileRow } = await adminSupabase
        .from('organization_profiles')
        .select('verification_email_last_sent, organization_name')
        .eq('account_id', authData.user.id)
        .maybeSingle()
      accountRow = profileRow

      if (!accountRow) {
        console.warn(`Missing organization_profiles row for account_id=${authData.user.id}`)
        return NextResponse.json({ error: 'Organization profile not found' }, { status: 404 })
      }
    } else {
      const { data: userRow } = await adminSupabase
        .from('users')
        .select('verification_email_last_sent, name')
        .eq('id', authData.user.id)
        .maybeSingle()
      accountRow = userRow
    }

    // Enforce 1 hour cooldown for verification email
    const now = new Date();
    if (accountRow?.verification_email_last_sent && now.getTime() - new Date(accountRow.verification_email_last_sent).getTime() < 60 * 60 * 1000) {
      const minutes = Math.ceil((60 * 60 * 1000 - (now.getTime() - new Date(accountRow.verification_email_last_sent).getTime())) / (60 * 1000));
      return NextResponse.json({ error: `You can request a new verification email in ${minutes} minute(s).` }, { status: 429 });
    }

    if (accountType === 'organization') {
      await adminSupabase
        .from('organization_profiles')
        .update({ verification_email_last_sent: now.toISOString() })
        .eq('account_id', authData.user.id)
    } else {
      await adminSupabase
        .from('users')
        .update({ verification_email_last_sent: now.toISOString() })
        .eq('id', authData.user.id)
    }

    const { data: verifyLink } = await adminSupabase.auth.admin.generateLink({
      type: 'signup',
      email: authData.user.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?verified=1&type=${accountType}`
      }
    } as any)

    // Send verification email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
    const verifyUrl = verifyLink?.properties?.action_link || `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email`;
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: authData.user.email,
      subject: 'E-poçt ünvanınızı təsdiqləyin - icma360',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333; text-align: center;">icma360-a xoş gəlmisiniz!</h2>
          <p>Salam ${accountRow?.name || accountRow?.organization_name || authData.user.email},</p>
          <p>Qeydiyyatdan keçdiyiniz üçün təşəkkür edirik. E-poçt ünvanınızı təsdiqləmək üçün aşağıdakı düyməni klikləyin:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">E-poçtu Təsdiqlə</a>
          </div>
          <p>Düymə işləmirsə, bu linki brauzeriziə kopyalayıb yapışdıra bilərsiniz:</p>
          <p style="word-break: break-all; color: #007bff;">${verifyUrl}</p>
          <p>Bu təsdiqləmə linki 24 saat ərzində etibarsız olacaq.</p>
          <p>Bu hesabı siz yaratmamısınızsa, bu e-poçtu nəzərə almayın.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            Bu e-poçt icma360 tərəfindən göndərilib<br>
            Sualınız varsa, bizimlə əlaqə saxlayın: support@icma360.az
          </p>
        </div>
      `
    });
    return NextResponse.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
  }
}

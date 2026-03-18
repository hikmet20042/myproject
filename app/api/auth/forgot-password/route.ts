import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { passwordResetEmailTemplate } from '@/lib/email-templates/password-reset'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

const RESET_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient()

    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', normalizedEmail)
      .maybeSingle()

    const { data: organizationProfile } = user ? { data: null as any } : await supabase
      .from('organization_profiles')
      .select('account_id, organization_name, email')
      .eq('email', normalizedEmail)
      .maybeSingle()

    const orgAccount = organizationProfile
      ? { id: organizationProfile.account_id, organization_name: organizationProfile.organization_name, email: organizationProfile.email }
      : null
    const account = user || orgAccount
    if (!account) {
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      }, { status: 200 })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = await bcrypt.hash(resetToken, 12)
    const expiryDate = new Date(Date.now() + RESET_EXPIRY_MS)

    if (user) {
      await supabase
        .from('users')
        .update({ password_reset_token: hashedToken, password_reset_expires: expiryDate.toISOString() })
        .eq('id', user.id)
    } else if (orgAccount) {
      await supabase
        .from('organization_profiles')
        .update({ password_reset_token: hashedToken, password_reset_expires: expiryDate.toISOString() })
        .eq('account_id', orgAccount.id)
    }

    const accountType = user ? 'user' : 'organization'
    const displayName = user ? user.name : orgAccount?.organization_name
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}&accountType=${accountType}`

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587', 10),
        secure: false,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      })

      const emailTemplate = passwordResetEmailTemplate(displayName, resetUrl)

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: normalizedEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      })
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError)
    }

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    }, { status: 200 })
  } catch (error) {
    console.error('Error in forgot password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

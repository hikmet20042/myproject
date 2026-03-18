import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email, password, accountType } = body

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: 'Token, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const supabase = createSupabaseAdminClient()

    if (accountType === 'organization') {
      const { data: organizationProfile } = await supabase
        .from('organization_profiles')
        .select('account_id, password_reset_token, password_reset_expires')
        .eq('email', normalizedEmail)
        .maybeSingle()

      const organization = organizationProfile
        ? {
            id: organizationProfile.account_id,
            password_reset_token: organizationProfile.password_reset_token,
            password_reset_expires: organizationProfile.password_reset_expires,
          }
        : null

      if (!organization?.password_reset_token || !organization.password_reset_expires) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        )
      }
      if (new Date(organization.password_reset_expires) < new Date()) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        )
      }
      const isValidToken = await bcrypt.compare(token, organization.password_reset_token)
      if (!isValidToken) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        )
      }
      const { error: updateError } = await supabase.auth.admin.updateUserById(organization.id, {
        password
      })

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        )
      }

      await supabase
        .from('organization_profiles')
        .update({ password_reset_token: null, password_reset_expires: null })
        .eq('account_id', organization.id)

      return NextResponse.json(
        { message: 'Password has been reset successfully' },
        { status: 200 }
      )
    }

    // accountType === 'user' or not provided: try User first, then organization for backward compatibility
    const { data: user } = await supabase
      .from('users')
      .select('id, password_reset_token, password_reset_expires')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (user?.password_reset_token && user.password_reset_expires) {
      if (new Date(user.password_reset_expires) < new Date()) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        )
      }
      const isValidToken = await bcrypt.compare(token, user.password_reset_token)
      if (isValidToken) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
          password
        })

        if (updateError) {
          return NextResponse.json(
            { error: updateError.message },
            { status: 500 }
          )
        }

        await supabase
          .from('users')
          .update({ password_reset_token: null, password_reset_expires: null })
          .eq('id', user.id)
        return NextResponse.json(
          { message: 'Password has been reset successfully' },
          { status: 200 }
        )
      }
    }

    // If not found as User (or wrong token), try organization when accountType not specified
    if (accountType !== 'user') {
      const { data: organizationProfile } = await supabase
        .from('organization_profiles')
        .select('account_id, password_reset_token, password_reset_expires')
        .eq('email', normalizedEmail)
        .maybeSingle()

      const organization = organizationProfile
        ? {
            id: organizationProfile.account_id,
            password_reset_token: organizationProfile.password_reset_token,
            password_reset_expires: organizationProfile.password_reset_expires,
          }
        : null

      if (organization?.password_reset_token && organization.password_reset_expires && new Date(organization.password_reset_expires) >= new Date()) {
        const isValidToken = await bcrypt.compare(token, organization.password_reset_token)
        if (isValidToken) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(organization.id, {
            password
          })

          if (updateError) {
            return NextResponse.json(
              { error: updateError.message },
              { status: 500 }
            )
          }

          await supabase
            .from('organization_profiles')
            .update({ password_reset_token: null, password_reset_expires: null })
            .eq('account_id', organization.id)
          return NextResponse.json(
            { message: 'Password has been reset successfully' },
            { status: 200 }
          )
        }
      }
    }

    return NextResponse.json(
      { error: 'Invalid or expired reset token' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in reset password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

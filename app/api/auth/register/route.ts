import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { ORGANIZATION_TYPE_VALUES } from '@/lib/organizationTypes'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient()
    const { name, email, password, type, organizationProfile } = await request.json();
    
    if (type === 'organization') {
      // Organization Registration
      if (!organizationProfile?.organizationName || !email || !password || !organizationProfile?.description || !organizationProfile?.contactPerson?.name || !organizationProfile?.contactPerson?.email || !organizationProfile?.organizationType) {
        return NextResponse.json(
          { error: 'Organization name, email, password, description, and contact person details are required' },
          { status: 400 }
        );
      }
      if (!ORGANIZATION_TYPE_VALUES.includes(organizationProfile.organizationType)) {
        return NextResponse.json(
          { error: 'Invalid organization type' },
          { status: 400 }
        );
      }
    } else {
      // User Registration
      if (!name || !email || !password) {
        return NextResponse.json(
          { error: 'Name, email, and password are required' },
          { status: 400 }
        );
      }
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }
    
    // Check if email already exists in both User and Organization tables
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    const { data: existingOrganizationProfile } = await supabase
      .from('organization_profiles')
      .select('account_id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser || existingOrganizationProfile) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }
    const accountType = type === 'organization' ? 'organization' : 'user'

    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        name: accountType === 'organization' ? organizationProfile?.organizationName : name,
      },
    })

    if (createError || !createdUser.user) {
      return NextResponse.json(
        { error: createError?.message || 'Failed to create account' },
        { status: 500 }
      )
    }

    const { error: accountError } = await supabase
      .from('accounts')
      .upsert({
        id: createdUser.user.id,
        account_type: accountType,
        is_admin: false,
        is_active: true,
      }, { onConflict: 'id' })

    if (accountError) {
      return NextResponse.json(
        { error: accountError.message },
        { status: 500 }
      )
    }

    if (accountType === 'organization') {
      const { error: profileError } = await supabase.from('organization_profiles').upsert({
        account_id: createdUser.user.id,
        organization_name: organizationProfile.organizationName,
        organization_type: organizationProfile.organizationType,
        email,
        profile_image: null,
        description: organizationProfile.description,
        website: organizationProfile.website,
        contact_phone: organizationProfile.contactPhone,
        address: organizationProfile.address,
        registration_number: organizationProfile.registrationNumber,
        focus_areas: organizationProfile.focusAreas || [],
        contact_person: organizationProfile.contactPerson,
        social_links: organizationProfile.socialMedia,
        moderation_status: 'pending',
        admin_comment: null,
        reviewed_at: null,
        reviewed_by: null,
      }, { onConflict: 'account_id' })

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message },
          { status: 500 }
        )
      }

    } else {
      const { error: userError } = await supabase.from('users').insert({
        id: createdUser.user.id,
        name,
        email,
        role: 'user',
        auth_provider: 'credentials'
      })

      if (userError) {
        return NextResponse.json(
          { error: userError.message },
          { status: 500 }
        )
      }
    }

    const { data: verifyLink } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?verified=1&type=${accountType}`
      }
    })
    // Create welcome notification
    const welcomeMessage = type === 'organization' 
      ? 'Təşkilat qeydiyyatınız üçün təşəkkür edirik. Zəhmət olmasa e-poçtunuzu təsdiqləyin və təşkilat funksiyalarına çıxış əldə etmək üçün admin təsdiqini gözləyin.'
      : 'İcmamıza qoşulduğunuz üçün təşəkkür edirik. Başlamaq üçün zəhmət olmasa e-poçtunuzu təsdiqləyin.';
    
    if (type !== 'organization') {
      await supabase.from('notifications').insert({
        user_id: createdUser.user.id,
        type: 'welcome',
        title: 'icma360-a xoş gəlmisiniz!',
        message: welcomeMessage,
        data: { type: 'welcome', userType: type },
      })
    }

    // Notify admins about new organization registration
    if (type === 'organization') {
      const { data: adminUsers } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')

      for (const admin of adminUsers || []) {
        await supabase.from('notifications').insert({
          user_id: admin.id,
          type: 'admin_action_required',
          title: 'Yeni təşkilat qeydiyyatı gözləyir',
          message: `${organizationProfile?.organizationName} təşkilat kimi qeydiyyatdan keçib və təsdiq gözləyir.`,
          data: {
            type: 'organization_approval_required',
            organizationId: createdUser.user.id,
            organizationName: organizationProfile?.organizationName
          },
        })
      }
    }
    // ...existing code...
    console.log('Email config debug:', {
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      user: process.env.EMAIL_SERVER_USER,
      hasPassword: !!process.env.EMAIL_SERVER_PASSWORD,
      passwordLength: process.env.EMAIL_SERVER_PASSWORD?.length,
      emailFrom: process.env.EMAIL_FROM
    })

    try {
      // Use Brevo SMTP
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      })

      console.log('Using Brevo SMTP')
      console.log('Email user:', process.env.EMAIL_SERVER_USER)

      const verificationUrl = verifyLink?.properties?.action_link || `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email`

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'E-poçt ünvanınızı təsdiqləyin - icma360',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #333; text-align: center;">icma360-a xoş gəlmisiniz!</h2>
            <p>Salam ${type === 'organization' ? organizationProfile?.organizationName : name},</p>
            <p>${type === 'organization' 
              ? `Təşkilat qeydiyyatınız üçün təşəkkür edirik "${organizationProfile?.organizationName || 'təşkilatınız'}". E-poçt ünvanınızı təsdiqləmək üçün aşağıdakı düyməni klikləyin. Təsdiqdən sonra təşkilat qeydiyyatınız admin komandamız tərəfindən nəzərdən keçiriləcək.`
              : 'Qeydiyyatdan keçdiyiniz üçün təşəkkür edirik. E-poçt ünvanınızı təsdiqləmək üçün aşağıdakı düyməni klikləyin:'
            }</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">E-poçtu təsdiqləyin</a>
            </div>
            <p>Əgər düymə işləmirsə, bu linki brauzerdə açın:</p>
            <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
            <p>Bu təsdiq linki 24 saat ərzində etibarlıdır.</p>
            <p>Əgər bu hesabı siz yaratmamısınızsa, bu e-poçtu nəzərə almayın.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666; text-align: center;">
              Bu e-poçt icma360 platformasından göndərilib<br>
              Suallarınız varsa, bizimlə əlaqə saxlayın: hikmat.mammadlii@gmail.com
            </p>
          </div>
        `
      })

      console.log('Verification email sent successfully to:', email)
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
      console.log('You can view the email at the preview URL above')
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Continue with registration even if email fails
    }

    return NextResponse.json({ 
      message: 'Registration successful! Please check your email to verify your account.' 
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Registration endpoint' })
}

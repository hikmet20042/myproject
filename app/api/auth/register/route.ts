import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import NotificationModel from '@/lib/models/Notification'

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
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
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    // Generate verification token
    const verificationToken = Math.random().toString(36).substring(2, 15);
    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      emailVerified: null,
    });
    // Create welcome notification
    await NotificationModel.create({
      userId: user._id,
      type: 'welcome',
      title: 'Welcome to Gender Equality Azerbaijan!',
      message: 'Thank you for joining our community. Please verify your email to get started.',
      data: { type: 'welcome' },
    });
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

      const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verify your email address',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #333; text-align: center;">Welcome to Gender Equality Azerbaijan!</h2>
            <p>Hello ${name},</p>
            <p>Thank you for registering with us. Please click the button below to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666; text-align: center;">
              This email was sent from Gender Equality Azerbaijan<br>
              If you have any questions, please contact us at hikmat.mammadlii@gmail.com
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

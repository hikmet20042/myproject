import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import { passwordResetEmailTemplate } from '@/lib/email-templates/password-reset'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    // Debug mongoose connection and model
    console.log('Mongoose connection state:', mongoose.connection.readyState)
    console.log('User model exists:', !!User)
    console.log('User schema paths:', Object.keys(User.schema.paths))
    
    // Clear model cache and recreate if needed
    if (mongoose.models.User) {
      delete mongoose.models.User
      console.log('Cleared cached User model')
    }
    
    // Force reimport of User model
    const { default: FreshUser } = await import('@/lib/models/User')
    console.log('Fresh User model schema paths:', Object.keys(FreshUser.schema.paths))
    
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    
    // Find user by email using fresh model
    const user = await FreshUser.findOne({ email: email.toLowerCase() })
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = await bcrypt.hash(resetToken, 12)

    console.log('Generated reset token:', {
      rawTokenLength: resetToken.length,
      hashedTokenLength: hashedToken.length,
      userEmail: user.email
    })

    // Set token and expiry (1 hour from now) using findByIdAndUpdate
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    console.log('Updating user with reset token:', {
      userId: user._id,
      email: user.email,
      hashedTokenLength: hashedToken.length,
      expiryDate: expiryDate
    })
    
    try {
      // First, let's try a direct update with more debugging
      console.log('Attempting direct update with FreshUser.updateOne')
      const directUpdate = await FreshUser.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordResetToken: hashedToken,
            passwordResetExpires: expiryDate
          }
        }
      )
      
      console.log('Direct update result:', {
        acknowledged: directUpdate.acknowledged,
        modifiedCount: directUpdate.modifiedCount,
        matchedCount: directUpdate.matchedCount,
        upsertedCount: directUpdate.upsertedCount
      })
      
      // Now try findByIdAndUpdate
      const updateResult = await FreshUser.findByIdAndUpdate(
        user._id,
        {
          passwordResetToken: hashedToken,
          passwordResetExpires: expiryDate
        },
        { new: true, runValidators: true }
      )
      
      console.log('User updated successfully with reset token', {
        updatedUserId: updateResult?._id,
        updatedTokenExists: !!updateResult?.passwordResetToken,
        updatedTokenLength: updateResult?.passwordResetToken?.length || 0,
        updatedExpiry: updateResult?.passwordResetExpires
      })
      
      // Verify the update by re-fetching the user
      const verifyUser = await FreshUser.findById(user._id)
      console.log('Verification after update:', {
        userFound: !!verifyUser,
        hasResetToken: verifyUser ? !!verifyUser.passwordResetToken : false,
        tokenLength: verifyUser && verifyUser.passwordResetToken ? verifyUser.passwordResetToken.length : 0,
        tokenExpiry: verifyUser ? verifyUser.passwordResetExpires : null
      })
      
      // Also check the raw document
      const rawUser = await FreshUser.findById(user._id).lean() as any
      console.log('Raw user document:', {
        id: rawUser?._id,
        email: rawUser?.email,
        passwordResetToken: rawUser?.passwordResetToken,
        passwordResetExpires: rawUser?.passwordResetExpires
      })
      
      if (!updateResult) {
        throw new Error('Failed to update user with reset token')
      }
    } catch (updateError) {
      console.error('Error updating user with reset token:', updateError)
      if (updateError instanceof Error && updateError.name === 'ValidationError') {
        console.error('Validation errors:', (updateError as any).errors)
      }
      throw updateError
    }

    // Send email
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      })

      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
      const emailTemplate = passwordResetEmailTemplate(user.name, resetUrl)

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      })

      console.log('Password reset email sent to:', email)
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError)
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in forgot password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
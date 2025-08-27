import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json()

    console.log('Reset password request:', { 
      token: token ? `${token.substring(0, 10)}...` : 'missing',
      email: email || 'missing',
      passwordLength: password ? password.length : 0
    })

    if (!token || !email || !password) {
      console.log('Missing required fields:', { token: !!token, email: !!email, password: !!password })
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

    await dbConnect()

    // First, find user by email without token expiry check
    const user = await User.findOne({ email: email.toLowerCase() })
    
    console.log('User lookup result:', {
      userFound: !!user,
      userId: user ? user._id : null,
      userEmail: user ? user.email : null,
      hasResetToken: user ? !!user.passwordResetToken : false,
      resetTokenLength: user && user.passwordResetToken ? user.passwordResetToken.length : 0,
      tokenExpiry: user ? user.passwordResetExpires : null,
      currentTime: new Date(),
      isTokenExpired: user && user.passwordResetExpires ? user.passwordResetExpires < new Date() : 'no expiry set'
    })
    
    // Let's also try to find the user with a reset token to see if there's any user with a token
    const userWithToken = await User.findOne({ 
      email: email.toLowerCase(),
      passwordResetToken: { $exists: true, $ne: null }
    })
    console.log('User with token lookup:', {
      foundUserWithToken: !!userWithToken,
      tokenExists: userWithToken ? !!userWithToken.passwordResetToken : false
    })

    if (!user) {
      console.log('User not found for email:', email.toLowerCase())
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    if (!user.passwordResetToken) {
      console.log('No reset token found for user')
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      console.log('Reset token has expired')
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Verify the token
    console.log('Comparing tokens:', {
      providedTokenLength: token.length,
      storedTokenLength: user.passwordResetToken.length
    })
    
    const isValidToken = await bcrypt.compare(token, user.passwordResetToken)
    console.log('Token comparison result:', isValidToken)
    
    if (!isValidToken) {
      console.log('Token verification failed')
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password and clear reset token
    user.password = hashedPassword
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in reset password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongoose'
import NGO from '@/lib/models/NGO'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    // Find NGO by email
    const ngo = await NGO.findOne({ email })
    if (!ngo) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Check if email is verified
    if (!ngo.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email before logging in' },
        { status: 401 }
      )
    }
    
    // Check if NGO is approved
    if (ngo.status !== 'approved') {
      return NextResponse.json(
        { error: 'Your NGO registration is still pending approval' },
        { status: 401 }
      )
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, ngo.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        ngoId: ngo._id, 
        email: ngo.email, 
        organizationName: ngo.organizationName,
        type: 'ngo'
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )
    
    // Set HTTP-only cookie
    const response = NextResponse.json({
      message: 'Login successful',
      ngo: {
        id: ngo._id,
        organizationName: ngo.organizationName,
        email: ngo.email,
        status: ngo.status
      }
    })
    
    response.cookies.set('ngo-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })
    
    return response
    
  } catch (error) {
    console.error('NGO login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
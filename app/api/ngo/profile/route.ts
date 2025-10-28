import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongoose'
import NGO from '@/lib/models/NGO'

// Helper function to verify NGO token
function verifyNGOToken(request: NextRequest) {
  const token = request.cookies.get('ngo-token')?.value
  
  if (!token) {
    return null
  }
  
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any
    return decoded
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const tokenData = verifyNGOToken(request)
    if (!tokenData || tokenData.type !== 'ngo') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const ngo = await NGO.findById(tokenData.ngoId).select('-password -verificationToken')
    if (!ngo) {
      return NextResponse.json(
        { error: 'NGO not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      ngo
    })
    
  } catch (error) {
    console.error('NGO profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect()
    
    const tokenData = verifyNGOToken(request)
    if (!tokenData || tokenData.type !== 'ngo') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const ngo = await NGO.findById(tokenData.ngoId)
    if (!ngo) {
      return NextResponse.json(
        { error: 'NGO not found' },
        { status: 404 }
      )
    }
    
    // Only allow updates if NGO is approved
    if (ngo.status !== 'approved') {
      return NextResponse.json(
        { error: 'Profile updates are only allowed for approved NGOs' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const {
      description,
      website,
      contactPhone,
      address,
      focusAreas,
      contactPerson,
      socialMedia
    } = body
    
    // Update allowed fields
    const updateData: any = {}
    if (description !== undefined) updateData.description = description
    if (website !== undefined) updateData.website = website
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone
    if (address !== undefined) updateData.address = address
    if (focusAreas !== undefined) updateData.focusAreas = focusAreas
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson
    if (socialMedia !== undefined) updateData.socialMedia = socialMedia
    
    const updatedNGO = await NGO.findByIdAndUpdate(
      tokenData.ngoId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -verificationToken')
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      ngo: updatedNGO
    })
    
  } catch (error) {
    console.error('NGO profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
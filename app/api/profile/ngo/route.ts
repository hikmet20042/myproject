import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an NGO
    if (session.user.role !== 'ngo') {
      return NextResponse.json({ error: 'Access denied. NGO role required.' }, { status: 403 })
    }

    await dbConnect()

    const body = await request.json()
    const {
      organizationName,
      description,
      website,
      contactPhone,
      address,
      registrationNumber,
      focusAreas,
      socialMedia
    } = body

    // Validate required fields
    if (!organizationName || !description) {
      return NextResponse.json(
        { error: 'Organization name and description are required' },
        { status: 400 }
      )
    }

    // Update the user's NGO profile
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          'ngoProfile.organizationName': organizationName,
          'ngoProfile.description': description,
          'ngoProfile.website': website || '',
          'ngoProfile.contactPhone': contactPhone || '',
          'ngoProfile.address': address || '',
          'ngoProfile.registrationNumber': registrationNumber || '',
          'ngoProfile.focusAreas': focusAreas || [],
          'ngoProfile.socialMedia': socialMedia || {}
        }
      },
      { new: true, runValidators: true }
    ).select('ngoProfile')

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'NGO profile updated successfully',
      ngoProfile: updatedUser.ngoProfile
    })

  } catch (error) {
    console.error('Error updating NGO profile:', error)
    return NextResponse.json(
      { error: 'Failed to update NGO profile' },
      { status: 500 }
    )
  }
}

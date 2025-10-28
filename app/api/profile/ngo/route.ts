import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import NGO from '@/lib/models/NGO'

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

    // Find and update the NGO profile for this user
    const updatedNGO = await NGO.findOneAndUpdate(
      { createdBy: session.user.id },
      {
        $set: {
          organizationName,
          description,
          website: website || '',
          contactPhone: contactPhone || '',
          address: address || '',
          registrationNumber: registrationNumber || '',
          focusAreas: focusAreas || [],
          socialMedia: socialMedia || {}
        }
      },
      { new: true, runValidators: true }
    )

    if (!updatedNGO) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'NGO profile updated successfully',
      ngoProfile: updatedNGO
    })

  } catch (error) {
    console.error('Error updating NGO profile:', error)
    return NextResponse.json(
      { error: 'Failed to update NGO profile' },
      { status: 500 }
    )
  }
}

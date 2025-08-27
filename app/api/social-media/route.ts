import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    // Fetch the user's social media accounts
    const user = await User.findById(session.user.id)
      .select('socialMedia ngoProfile.socialMedia role')
      .lean()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = user as any

    return NextResponse.json({
      socialMedia: userData.socialMedia || {},
      ngoSocialMedia: userData.role === 'ngo' ? userData.ngoProfile?.socialMedia || {} : null
    })

  } catch (error) {
    console.error('Error fetching social media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social media accounts' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const body = await request.json()
    const { socialMedia, ngoSocialMedia, type } = body

    // Validate social media URLs
    const validateUrl = (url: string) => {
      if (!url) return true
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    }

    const updateData: any = {}

    if (type === 'user' || !type) {
      // Update user's personal social media
      if (socialMedia) {
        // Validate URLs
        for (const [platform, url] of Object.entries(socialMedia)) {
          if (url && !validateUrl(url as string)) {
            return NextResponse.json(
              { error: `Invalid URL for ${platform}` },
              { status: 400 }
            )
          }
        }
        updateData.socialMedia = socialMedia
      }
    }

    if (type === 'ngo' && session.user.role === 'ngo') {
      // Update NGO's social media
      if (ngoSocialMedia) {
        // Validate URLs
        for (const [platform, url] of Object.entries(ngoSocialMedia)) {
          if (url && !validateUrl(url as string)) {
            return NextResponse.json(
              { error: `Invalid URL for ${platform}` },
              { status: 400 }
            )
          }
        }
        updateData['ngoProfile.socialMedia'] = ngoSocialMedia
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid social media data provided' },
        { status: 400 }
      )
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('socialMedia ngoProfile.socialMedia role')

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = updatedUser as any

    return NextResponse.json({
      message: 'Social media accounts updated successfully',
      socialMedia: userData.socialMedia || {},
      ngoSocialMedia: userData.role === 'ngo' ? userData.ngoProfile?.socialMedia || {} : null
    })

  } catch (error) {
    console.error('Error updating social media:', error)
    return NextResponse.json(
      { error: 'Failed to update social media accounts' },
      { status: 500 }
    )
  }
}
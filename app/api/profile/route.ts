import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import NGO from '@/lib/models/NGO'

// Force dynamic rendering due to session usage
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    // Fetch the user with their profile data
    const user = await User.findById(session.user.id)
      .select('name email role createdAt')
      .lean()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Type assertion to handle the lean() return type
    const userData = user as any

    // If user is NGO, fetch their NGO profile from separate collection
    let ngoProfile = null
    if (userData.role === 'ngo') {
      ngoProfile = await NGO.findOne({ createdBy: session.user.id }).lean()
    }

    return NextResponse.json({
      user: {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        ngoProfile: ngoProfile,
        createdAt: userData.createdAt
      }
    })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
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

    // If session is NGO, fetch from NGO collection
    if (session.user.isApprovedNGO) {
      const ngo = await NGO.findOne({ email: session.user.email })
        .select('organizationName email status createdAt profileImage image')
        .lean()

      if (!ngo) {
        return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
      }

      return NextResponse.json({
        user: {
          _id: (ngo as any)._id,
          name: (ngo as any).organizationName,
          email: (ngo as any).email,
          role: undefined, // NGOs don't have role in User collection
          isApprovedNGO: (ngo as any).status === 'approved',
          createdAt: (ngo as any).createdAt,
          profileImage: (ngo as any).profileImage,
          image: (ngo as any).profileImage?.url || (ngo as any).image
        }
      })
    }

    // Fetch regular user
    const user = await User.findById(session.user.id)
      .select('name email role createdAt profileImage image')
      .lean()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Type assertion to handle the lean() return type
    const userData = user as any

    return NextResponse.json({
      user: {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        createdAt: userData.createdAt,
        profileImage: userData.profileImage,
        image: userData.profileImage?.url || userData.image
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
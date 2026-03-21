import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

// Force dynamic rendering due to session usage
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseAdminClient()

    // If session is organization, fetch from Organization collection
    if (session.user.accountType === 'organization' && session.user.organizationStatus === 'approved') {
      const { data: organizationProfile } = await supabase
        .from('organization_profiles')
        .select('account_id, organization_name, email, moderation_status, created_at, profile_image')
        .eq('account_id', session.user.id)
        .maybeSingle()

      if (!organizationProfile) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }

      return NextResponse.json({
        user: {
          _id: organizationProfile.account_id,
          name: organizationProfile.organization_name,
          email: organizationProfile.email,
          role: undefined, // Organizations don't have role in User collection
          organizationStatus: organizationProfile.moderation_status,
          createdAt: organizationProfile.created_at,
          profileImage: organizationProfile.profile_image,
          image: (organizationProfile.profile_image as any)?.url || undefined
        }
      })
    }

    // Fetch regular user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('avatar, avatar_blob_id')
      .eq('user_id', session.user.id)
      .single()

    return NextResponse.json({
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        profileImage: userProfile?.avatar
          ? { url: userProfile.avatar, publicId: userProfile.avatar_blob_id }
          : null,
        image: userProfile?.avatar || null
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
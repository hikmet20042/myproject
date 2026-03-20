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

    // Fetch the user's social media accounts
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('social_media, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let organizationSocialMedia = null
    if (session.user.organizationStatus === 'approved') {
      const { data: profile } = await supabase
        .from('organization_profiles')
        .select('social_links')
        .eq('account_id', session.user.id)
        .maybeSingle()

      organizationSocialMedia = profile?.social_links || {}
    }

    return NextResponse.json({
      socialMedia: user.social_media || {},
      organizationSocialMedia
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
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseAdminClient()

    const body = await request.json()
    const { socialMedia, organizationSocialMedia, type } = body

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
        updateData.social_media = socialMedia
      }
    }

    if (type === 'organization' && session.user.organizationStatus === 'approved') {
      // Primary write to organization_profiles
      if (organizationSocialMedia) {
        // Validate URLs
        for (const [platform, url] of Object.entries(organizationSocialMedia)) {
          if (url && !validateUrl(url as string)) {
            return NextResponse.json(
              { error: `Invalid URL for ${platform}` },
              { status: 400 }
            )
          }
        }
        
        const { data: organization, error: organizationError } = await supabase
          .from('organization_profiles')
          .update({ social_links: organizationSocialMedia, updated_at: new Date().toISOString() })
          .eq('account_id', session.user.id)
          .select('social_links')
          .single()

        if (organizationError || !organization) {
          return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        return NextResponse.json({ 
          message: 'Social media updated successfully',
          socialMedia: {},
          organizationSocialMedia: organization.social_links || {}
        })
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid social media data provided' },
        { status: 400 }
      )
    }

    // Update the user
    const { data: updatedUser, error: updatedUserError } = await supabase
      .from('users')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
      .select('social_media, role')
      .single()

    if (updatedUserError || !updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Social media accounts updated successfully',
      socialMedia: updatedUser.social_media || {},
      organizationSocialMedia: null
    })

  } catch (error) {
    console.error('Error updating social media:', error)
    return NextResponse.json(
      { error: 'Failed to update social media accounts' },
      { status: 500 }
    )
  }
}